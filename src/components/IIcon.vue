<script setup lang="ts">
import { computed } from 'vue'
import { icons, type IconName } from './icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    /** 尺寸跟随字号更自然，传数字则按 px */
    size?: number | string
    /** 线宽；小尺寸下适当加粗才不显虚 */
    strokeWidth?: number
    /** 无障碍标签；不传时视为装饰性图标，对读屏隐藏 */
    label?: string
    spin?: boolean
  }>(),
  { size: '1em', strokeWidth: 1.8, label: '', spin: false }
)

const path = computed(() => icons[props.name])
const dimension = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <svg
    class="i-icon"
    :class="{ 'is-spin': spin }"
    :style="{ width: dimension, height: dimension }"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="strokeWidth"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <path :d="path" />
  </svg>
</template>

<style scoped>
.i-icon {
  flex: none;
  display: inline-block;
  vertical-align: -0.125em;
}
.i-icon.is-spin { animation: i-icon-spin 900ms linear infinite; }
@keyframes i-icon-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .i-icon.is-spin { animation: i-icon-pulse 1.4s ease-in-out infinite; }
  @keyframes i-icon-pulse { 50% { opacity: 0.4; } }
}
</style>
