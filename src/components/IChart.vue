<script setup lang="ts">
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
  type ChartSeries
} from '@i-design/common'

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
  }>(),
  {
    type: 'line',
    stacked: false,
    height: 240,
    fromZero: true,
    labelLast: true,
    title: '',
    unit: ''
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

const showTable = ref(false)
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

      <!-- x 轴标签：标签多时隔一个显示，避免叠字 -->
      <g>
        <text
          v-for="(label, i) in labels"
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
        :aria-pressed="!hidden.has(s.name)"
        @click="toggle(s.name)"
      >
        <span class="i-chart__swatch" :style="{ background: colorOf(s.name) }" />
        {{ s.name }}
      </button>
    </div>

    <button class="i-chart__table-toggle" @click="showTable = !showTable">
      {{ showTable ? '收起数据表' : '查看数据表' }}
    </button>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr>
          <th>{{ title || '类别' }}</th>
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
