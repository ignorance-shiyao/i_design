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
      :class="[`i-badge--${type}`, { 'is-dot': dot, 'is-fixed': !!$slots.default }]"
      :aria-label="dot ? '有新内容' : `${count} 条`"
    >
      <template v-if="!dot">{{ text }}</template>
    </span>
  </span>
</template>

<style scoped>
.i-badge { position: relative; display: inline-flex; vertical-align: middle; }

.i-badge__mark {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--i-radius-full);
  color: #fff;
  font-size: var(--i-font-size-xs);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.i-badge__mark.is-fixed {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  box-shadow: 0 0 0 2px var(--i-color-bg);
}
.i-badge__mark.is-dot {
  min-width: 8px;
  width: 8px;
  height: 8px;
  padding: 0;
}
.i-badge--brand { background: var(--i-color-brand); }
.i-badge--success { background: var(--i-color-success); }
.i-badge--warning { background: var(--i-color-warning); }
.i-badge--danger { background: var(--i-color-danger); }
</style>
