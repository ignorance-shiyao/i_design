<script setup lang="ts">
import { useConfig } from './useConfig'
import { computed, ref } from 'vue'
import { boxStats, formatTick, niceTicks, scaleY } from '@i-design/common'

/* 文案走字典：图表的数据表是它的无障碍出口，按钮与表头也得跟着换语言 */
const { locale } = useConfig()

export interface BoxGroup {
  label: string
  values: number[]
}

const props = withDefaults(
  defineProps<{
    groups: BoxGroup[]
    title?: string
    height?: number
    /** 纵轴单位，跟在刻度后面 */
    unit?: string
  }>(),
  { title: '', height: 260, unit: '' }
)

const W = 640
const PAD = { top: 16, right: 16, bottom: 28, left: 48 }
const plotW = W - PAD.left - PAD.right
const plotH = computed(() => props.height - PAD.top - PAD.bottom)

const stats = computed(() => props.groups.map((g) => ({ label: g.label, ...boxStats(g.values) })))

/*
 * 值域要把离群点也包进去：把它们裁到画布外，图上就看不出「有异常值」这件事，
 * 而那往往正是看箱线图的原因。
 */
const scale = computed(() => {
  const all = stats.value.flatMap((s) => [s.min, s.max])
  const finite = all.filter((v) => Number.isFinite(v))
  if (!finite.length) return { min: 0, max: 1, ticks: [0, 1] }
  const ticks = niceTicks(Math.min(...finite), Math.max(...finite), 5)
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks }
})

const y = (v: number) => scaleY(v, scale.value.min, scale.value.max, plotH.value) + PAD.top
const band = computed(() => plotW / Math.max(1, props.groups.length))
/* 箱体占带宽的一半：留出的空白让相邻箱子不会看起来像连成一片 */
const boxW = computed(() => Math.min(56, band.value * 0.5))
const center = (i: number) => PAD.left + band.value * (i + 0.5)

const active = ref(-1)
const showTable = ref(false)
</script>

<template>
  <figure class="i-chart">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <svg
      class="i-chart__svg"
      :viewBox="`0 0 ${W} ${height}`"
      role="img"
      :aria-label="title || '箱线图'"
      @mouseleave="active = -1"
    >
      <g v-for="tick in scale.ticks" :key="tick">
        <line class="i-chart__grid" :x1="PAD.left" :x2="W - PAD.right" :y1="y(tick)" :y2="y(tick)" />
        <text class="i-chart__tick" :x="PAD.left - 8" :y="y(tick) + 4" text-anchor="end">
          {{ formatTick(tick) }}{{ unit }}
        </text>
      </g>

      <g
        v-for="(s, i) in stats"
        :key="s.label"
        class="i-box"
        :class="{ 'is-active': active === i }"
        @mouseenter="active = i"
      >
        <!-- 须：延伸到 1.5×IQR 内的实测值，不是围栏位置 -->
        <line class="i-box__whisker" :x1="center(i)" :x2="center(i)" :y1="y(s.upper)" :y2="y(s.q3)" />
        <line class="i-box__whisker" :x1="center(i)" :x2="center(i)" :y1="y(s.q1)" :y2="y(s.lower)" />
        <line
          class="i-box__cap"
          :x1="center(i) - boxW / 4"
          :x2="center(i) + boxW / 4"
          :y1="y(s.upper)"
          :y2="y(s.upper)"
        />
        <line
          class="i-box__cap"
          :x1="center(i) - boxW / 4"
          :x2="center(i) + boxW / 4"
          :y1="y(s.lower)"
          :y2="y(s.lower)"
        />

        <rect
          class="i-box__body"
          :x="center(i) - boxW / 2"
          :y="y(s.q3)"
          :width="boxW"
          :height="Math.max(1, y(s.q1) - y(s.q3))"
          rx="2"
        />
        <!-- 中位线加粗：它是箱子里唯一需要一眼读出的位置 -->
        <line
          class="i-box__median"
          :x1="center(i) - boxW / 2"
          :x2="center(i) + boxW / 2"
          :y1="y(s.median)"
          :y2="y(s.median)"
        />

        <circle
          v-for="(o, oi) in s.outliers"
          :key="oi"
          class="i-box__outlier"
          :cx="center(i)"
          :cy="y(o)"
          r="3"
        />

        <text class="i-chart__tick" :x="center(i)" :y="height - 8" text-anchor="middle">
          {{ s.label }}
        </text>
      </g>
    </svg>

    <!-- 悬停给出五数概括：箱子只表达相对位置，具体数值要能查得到 -->
    <p v-if="active >= 0" class="i-box__readout">
      <strong>{{ stats[active].label }}</strong>
      中位数 {{ formatTick(stats[active].median) }}{{ unit }} ·
      四分位 {{ formatTick(stats[active].q1) }}–{{ formatTick(stats[active].q3) }}{{ unit }} ·
      范围 {{ formatTick(stats[active].lower) }}–{{ formatTick(stats[active].upper) }}{{ unit }}
      <template v-if="stats[active].outliers.length">
        · {{ stats[active].outliers.length }} 个离群点
      </template>
    </p>

    <!-- 数据表：图形之外的另一条读取路径，读屏与灰度打印都靠它 -->
    <button class="i-chart__table-toggle" @click="showTable = !showTable">
      {{ showTable ? locale.chartTableHide : locale.chartTableShow }}
    </button>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr><th>分组</th><th>最小</th><th>Q1</th><th>中位数</th><th>Q3</th><th>最大</th><th>离群点</th></tr>
      </thead>
      <tbody>
        <tr v-for="s in stats" :key="s.label">
          <td>{{ s.label }}</td>
          <td>{{ formatTick(s.min) }}</td>
          <td>{{ formatTick(s.q1) }}</td>
          <td>{{ formatTick(s.median) }}</td>
          <td>{{ formatTick(s.q3) }}</td>
          <td>{{ formatTick(s.max) }}</td>
          <td>{{ s.outliers.length }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
