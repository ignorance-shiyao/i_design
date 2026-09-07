<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IAvatarGroup.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 超出部分折叠为 +N */
    max?: number
    size?: 'sm' | 'md' | 'lg' | number
    total?: number
  }>(),
  { max: 0, size: 'md', total: 0 }
)
</script>

<template>
  <div class="i-avatar-group">
    <slot />
    <span v-if="total > max && max > 0" class="i-avatar-group__more">+{{ total - max }}</span>
  </div>
</template>
