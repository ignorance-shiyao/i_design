<script setup lang="ts">
import { computed } from 'vue'
import { areaPath, domainOf, linePath, scaleX, scaleY } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    data: number[]
    width?: number
    height?: number
    /** 语义色：涨用成功色、跌用危险色时传它 */
    tone?: 'brand' | 'success' | 'danger' | 'neutral'
    area?: boolean
    /** 末点标记，指明「现在在哪」 */
    showLast?: boolean
  }>(),
  { width: 96, height: 28, tone: 'brand', area: true, showLast: true }
)

// 迷你图不从零起：它表达的是走势形状，不是绝对量级
const domain = computed(() => domainOf([{ name: '', data: props.data }], { fromZero: false }))
const color = computed(() =>
  props.tone === 'neutral' ? 'var(--i-color-text-tertiary)' : `var(--i-color-${props.tone})`
)
const lastX = computed(() => scaleX(props.data.length - 1, props.data.length, props.width))
const lastY = computed(() =>
  scaleY(props.data[props.data.length - 1] ?? 0, domain.value.min, domain.value.max, props.height)
)
</script>

<template>
  <span class="i-sparkline">
    <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true">
      <path
        v-if="area"
        class="i-sparkline__area"
        :d="areaPath(data, domain.min, domain.max, width, height)"
        :fill="color"
      />
      <path
        class="i-sparkline__line"
        :d="linePath(data, domain.min, domain.max, width, height)"
        :stroke="color"
      />
      <circle v-if="showLast" class="i-sparkline__last" :cx="lastX" :cy="lastY" r="2.5" :fill="color" />
    </svg>
  </span>
</template>
