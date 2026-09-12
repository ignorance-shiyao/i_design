<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChart.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { useConfig } from './useConfig'
import { computed, ref } from 'vue'
import {
  areaPath,
  bandPath,
  domainOf,
  formatTick,
  linePath,
  niceTicks,
  scaleX,
  scaleY,
  type ChartSeries,
  type ChartThreshold,
  labelStep,
  showLabelAt
} from '@i-design/common'

/* 文案走字典：图表的数据表是它的无障碍出口，按钮与表头也得跟着换语言 */
const { locale } = useConfig()

const props = withDefaults(
  defineProps<{
    /** 每个系列一条线／一组柱；系列顺序即取色顺序 */
    series: ChartSeries[]
    /** x 轴标签，与 data 一一对应 */
    labels: string[]
    type?: 'line' | 'area' | 'bar'
    /** 柱状图专用：堆叠而不是并排 */
    stacked?: boolean
    height?: number
    /** 折线是否从零起。柱状图恒从零起——不从零会放大差异，是最常见的误导 */
    fromZero?: boolean
    /** 末点直接标注数值，省掉「看图例再找线」这一步 */
    labelLast?: boolean
    title?: string
    /** 数值单位，出现在提示框里 */
    unit?: string
    /**
     * 阈值线与阈值带：把「多少算正常」画进图里。
     *
     * 没有它，读者只能看出趋势，看不出「现在是不是超了」——
     * 而后者往往才是看这张图的原因。value 是一条线，from/to 是一条带。
     */
    thresholds?: ChartThreshold[]
  }>(),
  {
    type: 'line',
    stacked: false,
    height: 240,
    fromZero: true,
    labelLast: true,
    title: '',
    unit: '',
    thresholds: () => []
  }
)

// 画布尺寸用视图坐标固定，外层再按容器宽度缩放；这样刻度密度不随容器抖动
const W = 640
// 右侧留白按是否直接标注决定：标注是文字，挤在边缘会被裁掉
const PAD = computed(() => ({
  top: 16,
  right: props.labelLast && props.type !== 'bar' ? 96 : 16,
  bottom: 28,
  left: 48
}))
const plotW = computed(() => W - PAD.value.left - PAD.value.right)
const plotH = computed(() => props.height - PAD.value.top - PAD.value.bottom)

/** 被图例关掉的系列：只影响显示，不改传入的数据 */
/*
 * 轴标签抽稀：标签一多就会互相压住，糊成一条黑边——那既读不出内容，
 * 也让人误以为轴上有一根粗线。按可用宽度算出每隔几个画一个。
 */
const tickStep = computed(() => labelStep(props.labels.length, plotW.value))

const hidden = ref<Set<string>>(new Set())

function toggle(name: string) {
  const next = new Set(hidden.value)
  // 不允许关掉最后一个系列：空图表没有信息量，只会让人以为坏了
  if (next.has(name)) next.delete(name)
  else if (props.series.length - next.size > 1) next.add(name)
  hidden.value = next
}
const visible = computed(() => props.series.filter((s) => !hidden.value.has(s.name)))

const isBar = computed(() => props.type === 'bar')
const stacked = computed(() => isBar.value && props.stacked)

/*
 * 多系列面积图按堆叠画：几层半透明面积叠在一起会混成一片说不清的颜色，
 * 而且读者无法判断某一层到底有多高。堆叠后每层的厚度就是它自己的值。
 */
const stackedArea = computed(() => props.type === 'area' && visible.value.length > 1)

const domain = computed(() =>
  domainOf(visible.value.length ? visible.value : props.series, {
    // 柱状图恒从零起：柱长本身就是数值，截断基线等于篡改数值
    fromZero: isBar.value ? true : props.fromZero,
    stacked: stacked.value || stackedArea.value
  })
)

/** 堆叠面积每层的累计值（上沿）与它下面一层的累计值（下沿） */
const areaSeries = computed(() =>
  visible.value.map((s, si) => {
    const below = (i: number) =>
      visible.value.slice(0, si).reduce((sum, o) => sum + (o.data[i] ?? 0), 0)
    return {
      name: s.name,
      data: stackedArea.value ? s.data.map((v, i) => v + below(i)) : s.data,
      base: stackedArea.value ? s.data.map((_, i) => below(i)) : s.data.map(() => Math.max(0, scale.value.min))
    }
  })
)
const ticks = computed(() => niceTicks(domain.value.min, domain.value.max, 5))
const scale = computed(() => ({ min: ticks.value[0], max: ticks.value[ticks.value.length - 1] }))

const colorOf = (name: string) => {
  const index = props.series.findIndex((s) => s.name === name)
  return `var(--i-chart-${(index % 8) + 1})`
}

const y = (v: number) => scaleY(v, scale.value.min, scale.value.max, plotH.value) + PAD.value.top
const x = (i: number) => scaleX(i, props.labels.length, plotW.value) + PAD.value.left

/**
 * 末点标注的纵向位置：先按数据点算，再把靠得太近的两条错开。
 * 两个系列在末尾接近时，直接按数据点放会把两行字叠在一起。
 */
const endLabels = computed(() => {
  const rows = visible.value.map((s, si) => {
    const raw = s.data[s.data.length - 1] ?? 0
    // 堆叠面积里线画在累计值上，标记必须跟着线走；
    // 但展示的仍是这个系列自己的值——读者要的是「它是多少」，不是「累计到多少」
    const plotted = stackedArea.value
      ? areaSeries.value[si].data[areaSeries.value[si].data.length - 1] ?? 0
      : raw
    return { name: s.name, value: raw, plotted, y: y(plotted) }
  })
  rows.sort((a, b) => a.y - b.y)
  const MIN_GAP = 15
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].y - rows[i - 1].y < MIN_GAP) rows[i].y = rows[i - 1].y + MIN_GAP
  }
  return rows
})

/* ---------- 柱状 ---------- */
const bandWidth = computed(() => plotW.value / Math.max(1, props.labels.length))
const barWidth = computed(() =>
  stacked.value ? bandWidth.value * 0.5 : (bandWidth.value * 0.62) / Math.max(1, visible.value.length)
)

function barX(seriesIndex: number, i: number) {
  const bandStart = PAD.value.left + bandWidth.value * i
  if (stacked.value) return bandStart + (bandWidth.value - barWidth.value) / 2
  const groupWidth = barWidth.value * visible.value.length
  return bandStart + (bandWidth.value - groupWidth) / 2 + seriesIndex * barWidth.value
}

/** 堆叠时每段的起点是它下面所有段的和 */
function stackBase(i: number, seriesIndex: number) {
  return visible.value.slice(0, seriesIndex).reduce((sum, s) => sum + (s.data[i] ?? 0), 0)
}

/* ---------- 悬停 ---------- */
const active = ref<number | null>(null)
const root = ref<HTMLElement | null>(null)

function onMove(event: MouseEvent) {
  const rect = root.value?.getBoundingClientRect()
  if (!rect || !props.labels.length) return
  const ratio = (event.clientX - rect.left) / rect.width
  const px = ratio * W
  // 取最近的数据点，而不是要求指针精确落在点上——命中区域要比标记大
  const step = isBar.value ? bandWidth.value : plotW.value / Math.max(1, props.labels.length - 1)
  const index = Math.round((px - PAD.value.left - (isBar.value ? bandWidth.value / 2 : 0)) / step)
  active.value = Math.min(props.labels.length - 1, Math.max(0, index))
}

const tooltipStyle = computed(() => {
  if (active.value === null) return {}
  const px = isBar.value ? PAD.value.left + bandWidth.value * (active.value + 0.5) : x(active.value)
  return { left: `${(px / W) * 100}%`, top: `${(y(scale.value.max) / props.height) * 100}%` }
})

/*
 * 阈值只有落在当前值域里才画得出来。
 * 超出值域的阈值静默丢弃——把它硬压到边缘会让读者误以为「刚好卡在临界」。
 */
const marks = computed(() =>
  props.thresholds
    .filter((t) => t.value === undefined || (t.value >= scale.value.min && t.value <= scale.value.max))
    .map((t) => {
      const status = t.status ?? 'warning'
      if (t.value !== undefined) {
        return { kind: 'line' as const, status, label: t.label ?? '', y: y(t.value), height: 0 }
      }
      const from = Math.max(scale.value.min, t.from ?? scale.value.min)
      const to = Math.min(scale.value.max, t.to ?? scale.value.max)
      return {
        kind: 'band' as const,
        status,
        label: t.label ?? '',
        y: y(to),
        height: Math.max(0, y(from) - y(to))
      }
    })
)

const showTable = ref(false)

/**
 * 导出 CSV：数据表解决了「读屏能读到」，导出解决了「拿去自己算」。
 * 两者都不该逼读者回去找数据源。
 */
function exportCsv() {
  const head = [props.title || locale.value.chartCategory, ...props.series.map((s) => s.name)]
  const rows = props.labels.map((label, i) => [label, ...props.series.map((s) => String(s.data[i] ?? ''))])
  // 字段里可能有逗号或引号，按 RFC 4180 转义，否则列会串位
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const csv = [head, ...rows].map((r) => r.map(cell).join(',')).join('\n')
  // BOM：没有它 Excel 会把中文表头认成乱码
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.title || 'chart'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <figure class="i-chart" ref="root">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <svg
      class="i-chart__svg"
      :viewBox="`0 0 ${W} ${height}`"
      :style="{ height: `${height}px` }"
      role="img"
      :aria-label="title || '图表'"
      @mousemove="onMove"
      @mouseleave="active = null"
    >
      <!-- 网格与刻度：背景信息，最淡的一档 -->
      <g>
        <template v-for="tick in ticks" :key="tick">
          <line class="i-chart__grid" :x1="PAD.left" :x2="W - PAD.right" :y1="y(tick)" :y2="y(tick)" />
          <text class="i-chart__tick" :x="PAD.left - 8" :y="y(tick) + 4" text-anchor="end">
            {{ formatTick(tick) }}
          </text>
        </template>
        <line
          class="i-chart__axis"
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="y(Math.max(scale.min, 0))"
          :y2="y(Math.max(scale.min, 0))"
        />
      </g>

      <!--
        阈值画在网格之上、数据之下：它是参考背景，不该盖住数据本身。
        带用低不透明度填充，线用虚线——实线会被误读成又一个数据系列。
      -->
      <g v-if="marks.length">
        <template v-for="(mark, mi) in marks" :key="`mark-${mi}`">
          <rect
            v-if="mark.kind === 'band'"
            class="i-chart__mark-area"
            :class="`is-${mark.status}`"
            :x="PAD.left"
            :y="mark.y"
            :width="plotW"
            :height="mark.height"
          />
          <line
            v-else
            class="i-chart__mark-line"
            :class="`is-${mark.status}`"
            :x1="PAD.left"
            :x2="W - PAD.right"
            :y1="mark.y"
            :y2="mark.y"
          />
        </template>
      </g>

      <!-- x 轴标签：标签多时隔一个显示，避免叠字 -->
      <g>
        <text
          v-for="(label, i) in labels"
          v-show="showLabelAt(i, labels.length, tickStep)"
          :key="label + i"
          class="i-chart__tick"
          :x="isBar ? PAD.left + bandWidth * (i + 0.5) : x(i)"
          :y="height - 8"
          text-anchor="middle"
          :opacity="labels.length > 12 && i % 2 === 1 ? 0 : 1"
        >
          {{ label }}
        </text>
      </g>

      <!-- 柱 -->
      <g v-if="isBar">
        <template v-for="(s, si) in visible" :key="s.name">
          <rect
            v-for="(value, i) in s.data"
            :key="`${s.name}-${i}`"
            class="i-chart__bar"
            :x="barX(si, i)"
            :y="stacked ? y(stackBase(i, si) + value) : y(Math.max(0, value))"
            :width="Math.max(1, barWidth)"
            :height="Math.max(0, Math.abs(y(value) - y(0)))"
            :fill="colorOf(s.name)"
            :rx="stacked && si !== visible.length - 1 ? 0 : 3"
            :opacity="active === null || active === i ? 1 : 0.55"
          />
        </template>
      </g>

      <!-- 线与面积 -->
      <g v-else>
        <!-- 每层画成上下沿之间的带状区域，颜色才等于系列色而不是叠出来的混合色 -->
        <path
          v-for="s in (type === 'area' ? areaSeries : [])"
          :key="`area-${s.name}`"
          class="i-chart__area"
          :d="stackedArea
            ? bandPath(s.base, s.data, scale.min, scale.max, plotW, plotH)
            : areaPath(s.data, scale.min, scale.max, plotW, plotH)"
          :fill="colorOf(s.name)"
          :transform="`translate(${PAD.left} ${PAD.top})`"
        />
        <path
          v-for="s in (type === 'area' ? areaSeries : visible)"
          :key="`line-${s.name}`"
          class="i-chart__line"
          :d="linePath(s.data, scale.min, scale.max, plotW, plotH)"
          :stroke="colorOf(s.name)"
          :transform="`translate(${PAD.left} ${PAD.top})`"
        />
        <!-- 末点直接标注：读者不必在图例与线之间来回找 -->
        <template v-if="labelLast">
          <g v-for="row in endLabels" :key="`label-${row.name}`">
            <circle
              :cx="x(labels.length - 1)"
              :cy="y(row.plotted)"
              r="4"
              class="i-chart__dot"
              :fill="colorOf(row.name)"
            />
            <text class="i-chart__label" :x="x(labels.length - 1) + 10" :y="row.y + 4">
              {{ row.name }} {{ formatTick(row.value) }}
            </text>
          </g>
        </template>
      </g>

      <!--
        阈值标签画在数据之上，而线与带留在数据之下。
        标签跟着色带一起沉到底层时，数据线会正好从字上穿过——描边光晕也救不回来，
        因为压在上面的是后画的线。层次分开，形状仍是背景，文字仍然可读。
      -->
      <g v-if="marks.length">
        <text
          v-for="(mark, mi) in marks"
          :key="`mark-label-${mi}`"
          class="i-chart__mark-label"
          :class="`is-${mark.status}`"
          :x="W - PAD.right - 4"
          :y="mark.y + (mark.kind === 'band' ? 14 : -5)"
          text-anchor="end"
        >
          {{ mark.label }}
        </text>
      </g>

      <!-- 悬停：十字线 + 命中点 -->
      <g v-if="active !== null && !isBar">
        <line
          class="i-chart__crosshair"
          :x1="x(active)"
          :x2="x(active)"
          :y1="PAD.top"
          :y2="height - PAD.bottom"
        />
        <circle
          v-for="s in (type === 'area' ? areaSeries : visible)"
          :key="`hit-${s.name}`"
          class="i-chart__dot"
          :cx="x(active)"
          :cy="y(s.data[active] ?? 0)"
          r="4.5"
          :fill="colorOf(s.name)"
        />
      </g>
    </svg>

    <div v-if="active !== null" class="i-chart__tooltip" :style="tooltipStyle">
      <div class="i-chart__tooltip-title">{{ labels[active] }}</div>
      <div v-for="s in visible" :key="`tip-${s.name}`" class="i-chart__tooltip-row">
        <span class="i-chart__swatch" :style="{ background: colorOf(s.name) }" />
        <span>{{ s.name }}</span>
        <span class="i-chart__tooltip-value">{{ formatTick(s.data[active] ?? 0) }}{{ unit }}</span>
      </div>
    </div>

    <!-- 两个以上系列必有图例：颜色不能是识别身份的唯一通道 -->
    <div v-if="series.length > 1" class="i-chart__legend">
      <button
        v-for="s in series"
        :key="`legend-${s.name}`"
        class="i-chart__legend-item"
        :class="{ 'is-off': hidden.has(s.name) }"
        :aria-pressed="String(!hidden.has(s.name))"
        @click="toggle(s.name)"
      >
        <span class="i-chart__swatch" :style="{ background: colorOf(s.name) }" />
        {{ s.name }}
      </button>
    </div>

    <div class="i-chart__actions">
      <button class="i-chart__table-toggle" @click="showTable = !showTable">
        {{ showTable ? locale.chartTableHide : locale.chartTableShow }}
      </button>
      <button class="i-chart__table-toggle" @click="exportCsv">导出 CSV</button>
    </div>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr>
          <th>{{ title || locale.chartCategory }}</th>
          <th v-for="s in series" :key="`th-${s.name}`">{{ s.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(label, i) in labels" :key="`tr-${label}-${i}`">
          <td>{{ label }}</td>
          <td v-for="s in series" :key="`td-${s.name}-${i}`">{{ formatTick(s.data[i] ?? 0) }}{{ unit }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
