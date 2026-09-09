<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartGauge.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { gaugeArc } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    value: number
    min?: number
    max?: number
    size?: number
    title?: string
    unit?: string
    /** 阈值：超过即转为对应状态色，用来表达「越界了」 */
    thresholds?: { value: number; status: 'success' | 'warning' | 'danger' }[]
  }>(),
  { min: 0, max: 100, size: 180, title: '', unit: '', thresholds: () => [] }
)

const percent = computed(() =>
  props.max === props.min ? 0 : (props.value - props.min) / (props.max - props.min)
)
const stroke = computed(() => Math.max(8, props.size * 0.09))
const arc = computed(() => gaugeArc(percent.value, props.size / 2, stroke.value))

/** 命中的最高阈值决定颜色；没有阈值时用品牌色 */
const color = computed(() => {
  const hit = [...props.thresholds]
    .sort((a, b) => a.value - b.value)
    .filter((t) => props.value >= t.value)
    .pop()
  return hit ? `var(--i-color-${hit.status})` : 'var(--i-color-brand)'
})
</script>

<template>
  <figure class="i-chart i-chart--gauge">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>
    <div class="i-chart__gauge" :style="{ width: `${size}px`, height: `${size * 0.78}px` }">
      <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" role="img" :aria-label="title || '仪表盘'">
        <!-- 开口朝下的 270°：整圆会让满值与零值落在同一位置，无法分辨 -->
        <path :d="arc.track" fill="none" stroke="var(--i-color-bg-muted)" :stroke-width="stroke" stroke-linecap="round" />
        <path v-if="arc.value" :d="arc.value" fill="none" :stroke="color" :stroke-width="stroke" stroke-linecap="round" />
      </svg>
      <div class="i-chart__gauge-label">
        <strong :style="{ color }">{{ value }}{{ unit }}</strong>
        <span>{{ min }} – {{ max }}{{ unit }}</span>
      </div>
    </div>
  </figure>
</template>
