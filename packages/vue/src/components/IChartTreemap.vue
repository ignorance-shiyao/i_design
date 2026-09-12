<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartTreemap.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { useConfig } from './useConfig'
import { computed, ref } from 'vue'
import { formatTick, treemapLayout, type TreemapItem } from '@i-design/common'

/* 文案走字典：图表的数据表是它的无障碍出口，按钮与表头也得跟着换语言 */
const { locale } = useConfig()

const props = withDefaults(
  defineProps<{
    items: TreemapItem[]
    title?: string
    height?: number
    unit?: string
  }>(),
  { title: '', height: 300, unit: '' }
)

const W = 640
const tiles = computed(() => treemapLayout(props.items, W, props.height))

/*
 * 矩形树图的块表达的是「多少」而不是「谁」，因此用单色顺序色阶：
 * 分类色会让人以为颜色另有含义，而面积已经在表达量级了。
 * 色阶共 5 档，按占比取档。
 */
const stepOf = (percent: number) => {
  const max = Math.max(...props.items.map((i) => i.value), 1)
  const total = props.items.reduce((s, i) => s + i.value, 0) || 1
  const ratio = (percent * total) / max
  return Math.min(5, Math.max(1, Math.round(ratio * 4) + 1))
}

/* 小块放不下文字：塞进去会溢出到相邻块上，看起来像标错了 */
const fits = (t: { width: number; height: number }) => t.width > 56 && t.height > 34

const active = ref<string | null>(null)
const showTable = ref(false)
</script>

<template>
  <figure class="i-chart">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <svg
      class="i-chart__svg"
      :viewBox="`0 0 ${W} ${height}`"
      role="img"
      :aria-label="title || '矩形树图'"
      @mouseleave="active = null"
    >
      <g
        v-for="tile in tiles"
        :key="tile.label"
        class="i-treemap__tile"
        :class="{ 'is-active': active === tile.label }"
        :style="{ '--i-treemap-ink': `var(--i-chart-seq-${stepOf(tile.percent)}-ink)` }"
        @mouseenter="active = tile.label"
      >
        <rect
          :x="tile.x + 1"
          :y="tile.y + 1"
          :width="Math.max(0, tile.width - 2)"
          :height="Math.max(0, tile.height - 2)"
          :fill="`var(--i-chart-seq-${stepOf(tile.percent)})`"
          rx="2"
        />
        <template v-if="fits(tile)">
          <text class="i-treemap__label" :x="tile.x + 10" :y="tile.y + 22">{{ tile.label }}</text>
          <text class="i-treemap__value" :x="tile.x + 10" :y="tile.y + 38">
            {{ formatTick(tile.value) }}{{ unit }} · {{ Math.round(tile.percent * 100) }}%
          </text>
        </template>
        <title>{{ tile.label }}：{{ formatTick(tile.value) }}{{ unit }}（{{ Math.round(tile.percent * 100) }}%）</title>
      </g>
    </svg>

    <p v-if="active" class="i-box__readout">
      <strong>{{ active }}</strong>
      {{ formatTick(tiles.find((t) => t.label === active)?.value ?? 0) }}{{ unit }} ·
      {{ Math.round((tiles.find((t) => t.label === active)?.percent ?? 0) * 100) }}%
    </p>

    <button class="i-chart__table-toggle" @click="showTable = !showTable">
      {{ showTable ? locale.chartTableHide : locale.chartTableShow }}
    </button>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr><th>项目</th><th>数值</th><th>占比</th></tr>
      </thead>
      <tbody>
        <tr v-for="tile in tiles" :key="tile.label">
          <td>{{ tile.label }}</td>
          <td>{{ formatTick(tile.value) }}{{ unit }}</td>
          <td>{{ Math.round(tile.percent * 100) }}%</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
