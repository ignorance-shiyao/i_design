<script setup lang="ts">
/**
 * 分布图：直方、密度、小提琴、误差棒（astra.md 的 D04）。
 *
 * 这些图最容易在「看起来很专业」的外表下说错话，所以组件把三件事印在图上，
 * 而不是留给读者去猜：
 *
 * - **分箱规则与宽度。** 换一个宽度，双峰就并成单峰。图注里写明用的是
 *   Freedman–Diaconis 还是 Sturges、箱宽是多少。
 * - **带宽。** 密度曲线唯一重要的旋钮：调小了噪声变成「第三个峰」，
 *   调大了两个峰并成一个。
 * - **误差棒是什么。** 标准差、标准误、95% 置信区间画出来差好几倍，
 *   说的是完全不同的事（数据有多散 / 均值估得多准 / 均值落在哪）。
 *
 * 样本量不足、取值全同这类「这张图现在不该被当真」的情况一并写出来——
 * 计算全在 logic/stats.ts 里，五端共用。
 */
import { computed, ref } from 'vue'
import { useChartWidth } from './useChartWidth'
import {
  errorBar,
  formatTick,
  histogram,
  kde,
  niceTicks,
  violinShape,
  type ErrorKind
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 原始样本。分布图吃的是样本本身，不是聚合过的值 */
    values: number[]
    type?: 'histogram' | 'density' | 'violin' | 'error'
    /** 分箱规则。fixed 时必须给 binWidth */
    rule?: 'freedman-diaconis' | 'sturges' | 'fixed'
    binWidth?: number
    /** 核密度带宽。不给则按 Silverman 经验法则算 */
    bandwidth?: number
    /** 误差棒的含义，必填意义上的选项：三者说的不是一回事 */
    errorKind?: ErrorKind
    height?: number
    title?: string
    unit?: string
  }>(),
  {
    type: 'histogram',
    rule: 'freedman-diaconis',
    binWidth: undefined,
    bandwidth: undefined,
    errorKind: 'sd',
    height: 260,
    title: '',
    unit: ''
  }
)

/*
 * 视图宽度跟着容器走（见 useChartWidth）：固定 640 时这张图在手机上被整体缩到
 * 0.48，11px 的刻度字实际只剩 6px——量出来的。对齐容器宽度后缩放比回到 1。
 */
const host = ref<HTMLElement | null>(null)
const W = useChartWidth(host)
const PAD = { top: 16, right: 16, bottom: 36, left: 52 }
const plotW = computed(() => W.value - PAD.left - PAD.right)
const plotH = computed(() => props.height - PAD.top - PAD.bottom)

const hist = computed(() =>
  props.type === 'histogram'
    ? histogram(props.values, { rule: props.rule, width: props.binWidth })
    : null
)
const density = computed(() =>
  props.type === 'density' ? kde(props.values, { bandwidth: props.bandwidth }) : null
)
const violin = computed(() =>
  props.type === 'violin' ? violinShape(props.values, { bandwidth: props.bandwidth }) : null
)
const bar = computed(() => (props.type === 'error' ? errorBar(props.values, props.errorKind) : null))

/** 值域：四种图型都沿横轴摆数值，所以刻度算法只有一份 */
const domain = computed(() => {
  const finite = props.values.filter((v) => Number.isFinite(v))
  if (!finite.length) return { min: 0, max: 1 }
  if (props.type === 'error' && bar.value) {
    return { min: Math.min(...finite, bar.value.low), max: Math.max(...finite, bar.value.high) }
  }
  if (density.value?.points.length) {
    return { min: density.value.points[0].x, max: density.value.points[density.value.points.length - 1].x }
  }
  return { min: Math.min(...finite), max: Math.max(...finite) }
})

const ticks = computed(() => niceTicks(domain.value.min, domain.value.max, 5))
const lo = computed(() => ticks.value[0])
const hi = computed(() => ticks.value[ticks.value.length - 1])
const x = (v: number) => PAD.left + ((v - lo.value) / (hi.value - lo.value || 1)) * plotW.value

/** 直方图的高度按最大频数归一化：纵轴是频数，不是密度 */
const maxCount = computed(() => Math.max(1, ...(hist.value?.bins ?? []).map((b) => b.count)))
const densityPeak = computed(() =>
  Math.max(1e-9, ...(density.value?.points ?? []).map((p) => p.y), ...(violin.value?.points ?? []).map((p) => p.density))
)

const densityPath = computed(() => {
  const points = density.value?.points ?? []
  if (!points.length) return ''
  return points
    .map((p, i) => {
      const py = PAD.top + plotH.value - (p.y / densityPeak.value) * plotH.value
      return `${i === 0 ? 'M' : 'L'}${x(p.x).toFixed(2)} ${py.toFixed(2)}`
    })
    .join(' ')
})

/** 小提琴：同一条密度上下对称。宽度按 peak 归一化，两把琴的「胖」才可比 */
const violinPath = computed(() => {
  const points = violin.value?.points ?? []
  if (!points.length) return ''
  const mid = PAD.top + plotH.value / 2
  const half = (d: number) => (d / densityPeak.value) * (plotH.value / 2)
  const top = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.value).toFixed(2)} ${(mid - half(p.density)).toFixed(2)}`)
  const bottom = [...points]
    .reverse()
    .map((p) => `L${x(p.value).toFixed(2)} ${(mid + half(p.density)).toFixed(2)}`)
  return `${top.join(' ')} ${bottom.join(' ')} Z`
})

/** 图注：把会改变结论的那几个数字写出来，而不是让读者猜 */
const caption = computed(() => {
  if (props.type === 'histogram' && hist.value) {
    const ruleName = hist.value.rule === 'freedman-diaconis' ? 'Freedman–Diaconis' : hist.value.rule === 'sturges' ? 'Sturges' : '固定宽度'
    return `${hist.value.count} 个样本，${hist.value.bins.length} 个箱，箱宽 ${formatTick(hist.value.width)}${props.unit}（${ruleName}）`
  }
  if (props.type === 'density' && density.value) {
    return `${props.values.length} 个样本，带宽 ${formatTick(density.value.bandwidth)}${props.unit}（Silverman）`
  }
  if (props.type === 'violin' && violin.value) {
    return `${props.values.length} 个样本，带宽 ${formatTick(violin.value.bandwidth)}${props.unit}；宽度按峰值归一化`
  }
  if (props.type === 'error' && bar.value) return bar.value.caption
  return ''
})

const issues = computed(() => [
  ...(hist.value?.issues ?? []),
  ...(density.value?.issues ?? []),
  ...(violin.value?.issues ?? [])
])

const mid = computed(() => PAD.top + plotH.value / 2)
</script>

<template>
  <figure ref="host" class="i-chart-dist">
    <figcaption v-if="title" class="i-chart-dist__title">{{ title }}</figcaption>

    <svg class="i-chart-dist__svg" :viewBox="`0 0 ${W} ${height}`" :style="{ height: `${height}px` }" role="img" :aria-label="`${title || '分布图'}：${caption}`">
      <!-- 刻度：背景信息，最淡的一档 -->
      <g>
        <template v-for="tick in ticks" :key="tick">
          <line class="i-chart-dist__grid" :x1="x(tick)" :x2="x(tick)" :y1="PAD.top" :y2="PAD.top + plotH" />
          <text class="i-chart-dist__tick" :x="x(tick)" :y="height - 12" text-anchor="middle">
            {{ formatTick(tick) }}
          </text>
        </template>
      </g>

      <!-- 直方：相邻箱之间留一像素缝，色觉障碍下它比颜色更可靠 -->
      <g v-if="type === 'histogram'">
        <rect
          v-for="(binItem, i) in hist?.bins ?? []"
          :key="i"
          class="i-chart-dist__bar"
          :x="x(binItem.from) + 0.5"
          :y="PAD.top + plotH - (binItem.count / maxCount) * plotH"
          :width="Math.max(1, x(binItem.to) - x(binItem.from) - 1)"
          :height="(binItem.count / maxCount) * plotH"
        />
      </g>

      <path v-else-if="type === 'density'" class="i-chart-dist__line" :d="densityPath" />

      <path v-else-if="type === 'violin'" class="i-chart-dist__violin" :d="violinPath" />

      <!-- 误差棒：中心是均值，两端是那句图注说的量 -->
      <g v-else-if="type === 'error' && bar">
        <line class="i-chart-dist__whisker" :x1="x(bar.low)" :x2="x(bar.high)" :y1="mid" :y2="mid" />
        <line class="i-chart-dist__cap" :x1="x(bar.low)" :x2="x(bar.low)" :y1="mid - 10" :y2="mid + 10" />
        <line class="i-chart-dist__cap" :x1="x(bar.high)" :x2="x(bar.high)" :y1="mid - 10" :y2="mid + 10" />
        <circle class="i-chart-dist__mean" :cx="x(bar.mean)" :cy="mid" r="5" />
      </g>
    </svg>

    <!-- 会改变结论的数字写在图下：分箱宽度、带宽、误差棒的含义 -->
    <p class="i-chart-dist__caption">{{ caption }}</p>
    <p v-for="issue in issues" :key="issue.kind" class="i-chart-dist__issue" role="status">
      {{ issue.message }}
    </p>
  </figure>
</template>
