<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IBadge.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    count?: number
    /** 超过上限显示为 max+ */
    max?: number
    /** 只显示一个圆点，用于「有更新」这类不需要计数的场景 */
    dot?: boolean
    /** count 为 0 时是否仍然显示 */
    showZero?: boolean
    type?: 'brand' | 'success' | 'warning' | 'danger'
  }>(),
  { count: 0, max: 99, dot: false, showZero: false, type: 'danger' }
)

const visible = computed(() => props.dot || props.count > 0 || (props.count === 0 && props.showZero))
const text = computed(() => (props.count > props.max ? `${props.max}+` : String(props.count)))
</script>

<template>
  <span class="i-badge">
    <slot />
    <!-- 有插槽内容时作为角标定位，独立使用时就地渲染 -->
    <span
      v-if="visible"
      class="i-badge__mark"
      :class="[`i-badge--${type}`, { 'is-dot': dot, 'is-fixed': !!$scopedSlots.default }]"
      :aria-label="dot ? '有新内容' : `${count} 条`"
    >
      <template v-if="!dot">{{ text }}</template>
    </span>
  </span>
</template>
