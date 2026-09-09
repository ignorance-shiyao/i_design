<script setup lang="ts">
import { computed } from 'vue'
import { icons, type IconName } from '@i-design/common'

const props = withDefaults(
  defineProps<{ name: IconName; size?: number | string; strokeWidth?: number; spin?: boolean }>(),
  { size: '1em', strokeWidth: 1.8, spin: false }
)

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
    aria-hidden="true"
  >
    <path :d="icons[name]" />
  </svg>
</template>
