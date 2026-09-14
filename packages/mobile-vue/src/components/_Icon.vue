<script setup lang="ts">
import { computed } from 'vue'
import { icons, type IconName } from '@i-design/common'

const props = withDefaults(
  defineProps<{ name: IconName; size?: number | string; strokeWidth?: number; spin?: boolean }>(),
  { size: '1em', strokeWidth: 1.8, spin: false }
)

const dimension = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
/* 默认尺寸由 .i-icon 的类给出；内联 style 在严格 CSP 下会被整条拒绝 */
const sizing = computed(() => (dimension.value === '1em' ? undefined : { width: dimension.value, height: dimension.value }))
</script>

<template>
  <svg
    class="i-icon"
    :class="{ 'is-spin': spin }"
    :style="sizing"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="strokeWidth"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="icons[name]" />
  </svg>
</template>
