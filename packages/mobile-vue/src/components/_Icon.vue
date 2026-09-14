<script setup lang="ts">
import { computed } from 'vue'
import { icons, filledIcons, hasFilled, FILLED_SECONDARY_OPACITY, type IconName } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number | string
    strokeWidth?: number
    spin?: boolean
    path?: string
    /** 描边还是填充；没有填充版的图标自动退回描边 */
    variant?: 'stroke' | 'fill'
  }>(),
  { size: '1em', strokeWidth: 1.8, spin: false, path: undefined, variant: 'stroke' }
)

const dimension = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
/* 默认尺寸由 .i-icon 的类给出；内联 style 在严格 CSP 下会被整条拒绝 */
const filled = computed(() =>
  props.variant === 'fill' && !props.path && hasFilled(props.name) ? filledIcons[props.name] : null
)
const sizing = computed(() => (dimension.value === '1em' ? undefined : { width: dimension.value, height: dimension.value }))
</script>

<template>
  <svg
    class="i-icon"
    :class="{ 'is-spin': spin }"
    :style="sizing"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke-width="filled ? 0 : strokeWidth"
    :stroke="filled ? 'none' : 'currentColor'"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="filled">
      <path v-if="filled.secondary" :d="filled.secondary" :opacity="FILLED_SECONDARY_OPACITY" />
      <path :d="filled.path" />
    </template>
    <path v-else :d="path ?? icons[name]" />
  </svg>
</template>
