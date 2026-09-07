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

<style scoped>
.i-avatar-group { display: inline-flex; align-items: center; }
/* 负边距叠压，并给每个头像加一圈与背景同色的描边把层次分开 */
.i-avatar-group :deep(.i-avatar) {
  margin-left: -8px;
  box-shadow: 0 0 0 2px var(--i-color-bg);
}
.i-avatar-group :deep(.i-avatar:first-child) { margin-left: 0; }
.i-avatar-group__more {
  display: inline-grid;
  place-items: center;
  min-width: 32px;
  height: 32px;
  margin-left: -8px;
  padding: 0 var(--i-spacing-1);
  border-radius: var(--i-radius-full);
  background: var(--i-color-bg-muted);
  box-shadow: 0 0 0 2px var(--i-color-bg);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
}
</style>
