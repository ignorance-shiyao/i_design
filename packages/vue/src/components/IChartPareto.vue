<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartPareto.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { ParetoModel } from '@i-design/common'

const props = withDefaults(defineProps<{
  /** buildPareto 生成的同源模型，可直接序列化给其他端 */
  model: ParetoModel
  title?: string
  selectedId?: string
  height?: number
}>(), { title: '帕累托图', selectedId: '', height: 220 })
const emit = defineEmits<{ (e: 'select', id: string): void }>()
const points = computed(() => props.model.rows.map(row => `${(row.rank - 0.5) * 100 / props.model.rows.length},${100 - (row.cumulative ?? 0) * 100}`).join(' '))
</script>

<template>
  <figure class="i-pareto">
    <figcaption class="i-pareto__title">{{ title }}</figcaption>
    <p class="i-pareto__caption">{{ model.caption }}</p>
    <template v-if="model.state === 'ready'">
      <div class="i-pareto__legend"><span>柱形：0 — {{ model.maxText }}</span><span>折线：累计占比 0 — 100%</span></div>
      <svg class="i-pareto__plot" viewBox="0 0 100 100" preserveAspectRatio="none" :style="{ height: `${height}px` }" role="img" :aria-label="`${title}。${model.caption}。下方可按类别选择并读取数据。`">
        <line v-for="y in [0, 25, 50, 75, 100]" :key="y" x1="0" x2="100" :y1="y" :y2="y" class="i-pareto__grid" />
        <rect v-for="row in model.rows" :key="row.id" :x="(row.rank - 1) * 100 / model.rows.length + 10 / model.rows.length" :width="80 / model.rows.length" :y="100 - row.relative * 100" :height="row.relative * 100" class="i-pareto__bar" :class="{ 'is-selected': row.id === selectedId }" @click="emit('select', row.id)"><title>{{ row.description }}</title></rect>
        <line x1="0" x2="100" :y1="100 - model.threshold * 100" :y2="100 - model.threshold * 100" class="i-pareto__threshold" />
        <polyline :points="points" class="i-pareto__line" />
        <line v-for="row in model.rows" :key="`point-${row.id}`" :x1="(row.rank - 0.5) * 100 / model.rows.length" :x2="(row.rank - 0.5) * 100 / model.rows.length" :y1="100 - (row.cumulative ?? 0) * 100" :y2="100 - (row.cumulative ?? 0) * 100" class="i-pareto__point" />
      </svg>
      <div class="i-pareto__ranks" aria-hidden="true"><span v-for="row in model.rows" :key="row.id">{{ row.rank }}</span></div>
      <p class="i-pareto__caption">虚线：{{ model.thresholdText }} 累计阈值。序号对应下方类别；累计只表示数量构成，不说明因果。</p>
    </template>
    <ol class="i-pareto__data" aria-label="帕累托数据">
      <li v-for="row in model.rows" :key="row.id">
        <button type="button" class="i-pareto__row" :aria-label="row.description" :aria-pressed="String(selectedId === row.id)" @click="emit('select', row.id)">
          <span>{{ row.rank }}. {{ row.label }}{{ selectedId === row.id ? ' · 已选' : '' }}</span>
          <span class="i-pareto__values">{{ row.valueText }} · 占比 {{ row.shareText }} · 累计 {{ row.cumulativeText }} · 源行 {{ row.sourceIndex + 1 }}</span>
        </button>
      </li>
    </ol>
    <ul v-if="model.excluded.length" class="i-pareto__issues" aria-label="未计入的类别"><li v-for="row in model.excluded" :key="row.id">源行 {{ row.sourceIndex + 1 }} · {{ row.label }}：{{ row.reason }}</li></ul>
  </figure>
</template>
