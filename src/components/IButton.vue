<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 视觉层级：主按钮 / 次按钮 / 文字按钮 / 危险操作 */
    variant?: 'primary' | 'secondary' | 'text' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    block?: boolean
  }>(),
  { variant: 'secondary', size: 'md', disabled: false, loading: false, block: false }
)

defineEmits<{ click: [MouseEvent] }>()
</script>

<template>
  <button
    class="i-button"
    :class="[`i-button--${variant}`, `i-button--${size}`, { 'is-block': block, 'is-loading': loading }]"
    :disabled="disabled || loading"
    type="button"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="i-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.i-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--i-spacing-2);
  font-family: inherit;
  font-size: var(--i-font-size-md);
  font-weight: 500;
  line-height: 1;
  border: 1px solid transparent;
  border-radius: var(--i-radius-md);
  cursor: pointer;
  transition: background var(--i-motion-fast) var(--i-motion-easing),
    border-color var(--i-motion-fast) var(--i-motion-easing),
    color var(--i-motion-fast) var(--i-motion-easing);
}
.i-button:disabled { cursor: not-allowed; opacity: 0.5; }
.i-button.is-block { display: flex; width: 100%; }

.i-button--sm { height: 28px; padding: 0 var(--i-spacing-3); font-size: var(--i-font-size-sm); }
.i-button--md { height: 34px; padding: 0 var(--i-spacing-4); }
.i-button--lg { height: 42px; padding: 0 var(--i-spacing-6); font-size: var(--i-font-size-lg); }

.i-button--primary {
  background: var(--i-gradient-brand);
  color: #fff;
  box-shadow: var(--i-shadow-sm);
}
.i-button--primary:hover:not(:disabled) { filter: brightness(1.06); box-shadow: var(--i-shadow-brand); }
.i-button--primary:active:not(:disabled) { filter: brightness(0.96); box-shadow: none; }

.i-button--secondary {
  background: var(--i-color-bg-elevated);
  border-color: var(--i-color-border);
  color: var(--i-color-text);
  box-shadow: var(--i-shadow-sm);
}
.i-button--secondary:hover:not(:disabled) {
  border-color: var(--i-color-brand);
  color: var(--i-color-brand);
}

.i-button--text {
  background: transparent;
  color: var(--i-color-brand);
  padding-left: var(--i-spacing-2);
  padding-right: var(--i-spacing-2);
}
.i-button--text:hover:not(:disabled) { background: var(--i-color-brand-subtle); }

.i-button--danger { background: var(--i-color-danger); color: #fff; }
.i-button--danger:hover:not(:disabled) { filter: brightness(1.08); }

.i-button__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--i-radius-full);
  animation: i-spin 700ms linear infinite;
}
@keyframes i-spin { to { transform: rotate(360deg); } }
</style>
