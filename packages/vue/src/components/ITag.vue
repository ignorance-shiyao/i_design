<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITag.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
withDefaults(
  defineProps<{ type?: 'default' | 'brand' | 'success' | 'warning' | 'danger'; round?: boolean }>(),
  { type: 'default', round: false }
)
</script>

<template>
  <span class="i-tag" :class="[`i-tag--${type}`, { 'is-round': round }]"><slot /></span>
</template>
