<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartScatter.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  SCATTER_MAX_SERIES,
  bubbleRadius,
  extentOf,
  formatTick,
  niceTicks,
  trendLine,
  type ScatterPoint,
  type ScatterSeries
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    series: ScatterSeries[]
    /** 横轴名称，散点的两个轴都需要说明，否则读者不知道在看什么关系 */
    xLabel?: string
    yLabel?: string
    height?: number
    title?: string
    xUnit?: string
    yUnit?: string
    /** 叠加最小二乘拟合线与 R²：把「看着像有关系」变成可核对的数字 */
    trend?: boolean
  }>(),
  { xLabel: '', yLabel: '', height: 280, title: '', xUnit: '', yUnit: '', trend: false }
)

const W = 640
const PAD = { top: 16, right: 24, bottom: 40, left: 56 }
const plotW = W - PAD.left - PAD.right
const plotH = computed(() => props.height - PAD.top - PAD.bottom)

/*
 * 超出上限的系列合并成「其他」，而不是继续取色。
 * 散点里任意两点都可能贴着，配色要按所有两两组合校验；本体系的分类色在
 * 这个口径下只有前三槽能同时通过亮色与暗色，第四槽与品牌蓝的色差低于硬下限。
 */
const shown = computed(() => {
  if (props.series.length <= SCATTER_MAX_SERIES) return props.series
  const head = props.series.slice(0, SCATTER_MAX_SERIES - 1)
  const rest = props.series.slice(SCATTER_MAX_SERIES - 1)
  return [...head, { name: '其他', data: rest.flatMap((s) => s.data) }]
})

const hidden = ref<Set<string>>(new Set())
const visible = computed(() => shown.value.filter((s) => !hidden.value.has(s.name)))
function toggle(name: string) {
  const next = new Set(hidden.value)
  if (next.has(name)) next.delete(name)
  else if (shown.value.length - next.size > 1) next.add(name)
  hidden.value = next
}

const allPoints = computed(() => visible.value.flatMap((s) => s.data))
const xExtent = computed(() => extentOf(allPoints.value, 'x'))
const yExtent = computed(() => extentOf(allPoints.value, 'y'))
const xTicks = computed(() => niceTicks(xExtent.value.min, xExtent.value.max, 5))
const yTicks = computed(() => niceTicks(yExtent.value.min, yExtent.value.max, 5))
const xScale = computed(() => ({ min: xTicks.value[0], max: xTicks.value[xTicks.value.length - 1] }))
const yScale = computed(() => ({ min: yTicks.value[0], max: yTicks.value[yTicks.value.length - 1] }))

const px = (v: number) => PAD.left + ((v - xScale.value.min) / (xScale.value.max - xScale.value.min)) * plotW
const py = (v: number) =>
  PAD.top + plotH.value - ((v - yScale.value.min) / (yScale.value.max - yScale.value.min)) * plotH.value

const sizeExtent = computed(() => extentOf(allPoints.value.filter((p) => p.size !== undefined), 'size'))
const hasSize = computed(() => allPoints.value.some((p) => p.size !== undefined))
const radiusOf = (point: ScatterPoint) =>
  point.size === undefined ? 5 : bubbleRadius(point.size, sizeExtent.value.min, sizeExtent.value.max)

const colorOf = (name: string) =>
  `var(--i-chart-${(shown.value.findIndex((s) => s.name === name) % SCATTER_MAX_SERIES) + 1})`

const fits = computed(() =>
  props.trend
    ? visible.value
        .map((s) => ({ name: s.name, fit: trendLine(s.data) }))
        .filter((row): row is { name: string; fit: NonNullable<ReturnType<typeof trendLine>> } => row.fit !== null)
    : []
)

const active = ref<{ series: string; point: ScatterPoint } | null>(null)
const showTable = ref(false)

// 同一页可能有多张散点图，裁剪区的 id 必须各自唯一，否则后一张会用到前一张的
const clipId = `i-scatter-clip-${Math.random().toString(36).slice(2, 9)}`
</script>

<template>
  <figure class="i-chart i-chart--scatter">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <svg
      class="i-chart__svg"
      :viewBox="`0 0 ${W} ${height}`"
      :style="{ height: `${height}px` }"
      role="img"
      :aria-label="title || '散点图'"
    >
      <!-- 两个方向都要网格：散点要同时读出横纵两个坐标，只给一个方向读不准 -->
      <g>
        <line
          v-for="tick in yTicks"
          :key="`gy-${tick}`"
          class="i-chart__grid"
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="py(tick)"
          :y2="py(tick)"
        />
        <line
          v-for="tick in xTicks"
          :key="`gx-${tick}`"
          class="i-chart__grid"
          :x1="px(tick)"
          :x2="px(tick)"
          :y1="PAD.top"
          :y2="height - PAD.bottom"
        />
        <text v-for="tick in yTicks" :key="`ty-${tick}`" class="i-chart__tick" :x="PAD.left - 8" :y="py(tick) + 4" text-anchor="end">
          {{ formatTick(tick) }}
        </text>
        <text v-for="tick in xTicks" :key="`tx-${tick}`" class="i-chart__tick" :x="px(tick)" :y="height - PAD.bottom + 18" text-anchor="middle">
          {{ formatTick(tick) }}
        </text>
      </g>

      <!-- 轴名：散点的两个轴都必须说明，不然读者不知道在看什么关系 -->
      <text v-if="xLabel" class="i-chart__axis-name" :x="PAD.left + plotW / 2" :y="height - 6" text-anchor="middle">
        {{ xLabel }}{{ xUnit }}
      </text>
      <text
        v-if="yLabel"
        class="i-chart__axis-name"
        :transform="`translate(14 ${PAD.top + plotH / 2}) rotate(-90)`"
        text-anchor="middle"
      >
        {{ yLabel }}{{ yUnit }}
      </text>

      <!--
        拟合线画在点之下（它是参考，不该盖住数据），并裁剪到绘图区内。
        不裁的话斜率大的拟合线会从网格顶端冲出去，看起来像坐标轴标错了。
      -->
      <defs>
        <clipPath :id="clipId">
          <rect :x="PAD.left" :y="PAD.top" :width="plotW" :height="plotH" />
        </clipPath>
      </defs>
      <line
        :clip-path="`url(#${clipId})`"
        v-for="row in fits"
        :key="`fit-${row.name}`"
        class="i-chart__trend"
        :x1="px(xScale.min)"
        :y1="py(row.fit.slope * xScale.min + row.fit.intercept)"
        :x2="px(xScale.max)"
        :y2="py(row.fit.slope * xScale.max + row.fit.intercept)"
        :stroke="colorOf(row.name)"
      />

      <g v-for="s in visible" :key="s.name">
        <!--
          每个点都描一圈背景色：点密集时重叠区域会糊成一块，
          有了这圈缝隙才数得清到底是几个点。
        -->
        <circle
          v-for="(point, i) in s.data"
          :key="`${s.name}-${i}`"
          class="i-chart__point"
          :cx="px(point.x)"
          :cy="py(point.y)"
          :r="radiusOf(point)"
          :fill="colorOf(s.name)"
          @mouseenter="active = { series: s.name, point }"
          @mouseleave="active = null"
        />
      </g>
    </svg>

    <div v-if="active" class="i-chart__tooltip is-static">
      <div class="i-chart__tooltip-title">{{ active.point.label || active.series }}</div>
      <div class="i-chart__tooltip-row">
        <span class="i-chart__tooltip-name">{{ xLabel || 'x' }}</span>
        <span class="i-chart__tooltip-value">{{ formatTick(active.point.x) }}{{ xUnit }}</span>
      </div>
      <div class="i-chart__tooltip-row">
        <span class="i-chart__tooltip-name">{{ yLabel || 'y' }}</span>
        <span class="i-chart__tooltip-value">{{ formatTick(active.point.y) }}{{ yUnit }}</span>
      </div>
    </div>

    <div v-if="shown.length > 1 || hasSize" class="i-chart__legend">
      <button
        v-for="s in shown"
        :key="s.name"
        class="i-chart__legend-item"
        :class="{ 'is-off': hidden.has(s.name) }"
        @click="toggle(s.name)"
      >
        <span class="i-chart__swatch" :style="{ background: colorOf(s.name) }" />
        {{ s.name }}
      </button>
      <span v-if="hasSize" class="i-chart__legend-note">气泡面积表示数值大小</span>
    </div>

    <p v-if="fits.length" class="i-chart__note">
      <template v-for="(row, i) in fits" :key="`r2-${row.name}`">
        {{ i > 0 ? ' · ' : '' }}{{ row.name }} R² {{ row.fit.r2.toFixed(2) }}
      </template>
    </p>

    <!-- 数据表：散点的坐标读屏读不出来，表格是唯一能读到的形式 -->
    <div class="i-chart__actions">
      <button class="i-chart__table-toggle" @click="showTable = !showTable">
        {{ showTable ? '收起数据表' : '查看数据表' }}
      </button>
    </div>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr>
          <th>系列</th>
          <th>{{ xLabel || 'x' }}</th>
          <th>{{ yLabel || 'y' }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="s in shown" :key="`tb-${s.name}`">
          <tr v-for="(point, i) in s.data" :key="`tr-${s.name}-${i}`">
            <td>{{ point.label || s.name }}</td>
            <td>{{ formatTick(point.x) }}{{ xUnit }}</td>
            <td>{{ formatTick(point.y) }}{{ yUnit }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </figure>
</template>
