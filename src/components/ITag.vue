<script setup lang="ts">
withDefaults(
  defineProps<{ type?: 'default' | 'brand' | 'success' | 'warning' | 'danger'; round?: boolean }>(),
  { type: 'default', round: false }
)
</script>

<template>
  <span class="i-tag" :class="[`i-tag--${type}`, { 'is-round': round }]"><slot /></span>
</template>
