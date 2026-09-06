<script setup lang="ts">
withDefaults(
  defineProps<{ type?: 'default' | 'brand' | 'success' | 'warning' | 'danger'; round?: boolean }>(),
  { type: 'default', round: false }
)
</script>

<template>
  <span class="i-tag" :class="[`i-tag--${type}`, { 'is-round': round }]"><slot /></span>
</template>

<style scoped>
.i-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 var(--i-spacing-2);
  font-size: var(--i-font-size-xs);
  border-radius: var(--i-radius-sm);
  border: 1px solid transparent;
}
.i-tag.is-round { border-radius: var(--i-radius-full); padding: 0 var(--i-spacing-3); }
.i-tag--default { background: var(--i-color-bg-muted); color: var(--i-color-text-secondary); }
.i-tag--brand { background: var(--i-color-brand-subtle); color: var(--i-color-brand); }
.i-tag--success { background: var(--i-color-success-subtle); color: var(--i-color-success); }
.i-tag--warning { background: var(--i-color-warning-subtle); color: var(--i-color-warning); }
.i-tag--danger { background: var(--i-color-danger-subtle); color: var(--i-color-danger); }
</style>
