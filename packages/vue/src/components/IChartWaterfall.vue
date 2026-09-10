<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartWaterfall.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  formatTick,
  niceTicks,
  scaleY,
  waterfallBars,
  waterfallDomain,
  type WaterfallItem
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    items: WaterfallItem[]
    title?: string
    height?: number
    unit?: string
  }>(),
  { title: '', height: 280, unit: '' }
)

const W = 640
const PAD = { top: 24, right: 16, bottom: 44, left: 56 }
const plotW = W - PAD.left - PAD.right
const plotH = computed(() => props.height - PAD.top - PAD.bottom)

const bars = computed(() => waterfallBars(props.items))

const scale = computed(() => {
  const [lo, hi] = waterfallDomain(bars.value)
  const ticks = niceTicks(lo, hi, 5)
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks }
})

const y = (v: number) => scaleY(v, scale.value.min, scale.value.max, plotH.value) + PAD.top
const band = computed(() => plotW / Math.max(1, bars.value.length))
const barW = computed(() => Math.min(48, band.value * 0.62))
const left = (i: number) => PAD.left + band.value * i + (band.value - barW.value) / 2

const active = ref(-1)
const showTable = ref(false)

/*
 * 连接线把上一根的终点引到下一根的起点。
 * 没有它，读者要自己在两根柱子之间脑补「接着往上/往下」，
 * 而这正是瀑布图区别于普通柱状图的地方。
 */
const connectors = computed(() =>
  bars.value.slice(0, -1).map((bar, i) => {
    const next = bars.value[i + 1]
    const yv = next.kind === 'total' ? bar.end : bar.end
    return { x1: left(i) + barW.value, x2: left(i + 1), y: y(yv) }
  })
)

const sign = (v: number) => (v > 0 ? `+${formatTick(v)}` : formatTick(v))
</script>

<template>
  <figure class="i-chart">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <svg
      class="i-chart__svg"
      :viewBox="`0 0 ${W} ${height}`"
      role="img"
      :aria-label="title || '瀑布图'"
      @mouseleave="active = -1"
    >
      <g v-for="tick in scale.ticks" :key="tick">
        <line class="i-chart__grid" :x1="PAD.left" :x2="W - PAD.right" :y1="y(tick)" :y2="y(tick)" />
        <text class="i-chart__tick" :x="PAD.left - 8" :y="y(tick) + 4" text-anchor="end">
          {{ formatTick(tick) }}{{ unit }}
        </text>
      </g>
      <!-- 零线加重：瀑布图里「回到零」是有意义的位置 -->
      <line class="i-wf__zero" :x1="PAD.left" :x2="W - PAD.right" :y1="y(0)" :y2="y(0)" />

      <line
        v-for="(c, i) in connectors"
        :key="`c-${i}`"
        class="i-wf__connector"
        :x1="c.x1"
        :x2="c.x2"
        :y1="c.y"
        :y2="c.y"
      />

      <g
        v-for="(bar, i) in bars"
        :key="bar.label"
        class="i-wf__bar"
        :class="[`is-${bar.kind}`, { 'is-active': active === i }]"
        @mouseenter="active = i"
      >
        <rect
          :x="left(i)"
          :y="Math.min(y(bar.start), y(bar.end))"
          :width="barW"
          :height="Math.max(2, Math.abs(y(bar.end) - y(bar.start)))"
          rx="2"
        />
        <!-- 增减量直接标在柱子上：瀑布图的读者要的就是这个数 -->
        <text
          class="i-wf__value"
          :x="left(i) + barW / 2"
          :y="Math.min(y(bar.start), y(bar.end)) - 6"
          text-anchor="middle"
        >
          {{ bar.kind === 'total' ? formatTick(bar.end) : sign(bar.delta) }}
        </text>
        <text class="i-chart__tick" :x="left(i) + barW / 2" :y="height - 20" text-anchor="middle">
          {{ bar.label }}
        </text>
      </g>
    </svg>

    <!--
      图例说明三种柱子。涨跌用发散色两端而不是状态色的绿/红：
      收入增加是好事、成本增加是坏事，「增加」本身没有好坏，
      用状态色会把一个中性的方向读成评价。
    -->
    <div class="i-chart__legend i-wf__legend">
      <span class="i-chart__legend-item"><span class="i-chart__swatch is-increase" />增加</span>
      <span class="i-chart__legend-item"><span class="i-chart__swatch is-decrease" />减少</span>
      <span class="i-chart__legend-item"><span class="i-chart__swatch is-total" />小计</span>
    </div>

    <button class="i-chart__table-toggle" @click="showTable = !showTable">
      {{ showTable ? '收起数据表' : '查看数据表' }}
    </button>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr><th>项目</th><th>增减</th><th>累计</th></tr>
      </thead>
      <tbody>
        <tr v-for="bar in bars" :key="bar.label">
          <td>{{ bar.label }}</td>
          <td>{{ bar.kind === 'total' ? '—' : sign(bar.delta) }}</td>
          <td>{{ formatTick(bar.end) }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
