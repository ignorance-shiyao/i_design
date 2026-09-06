<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    invalid?: boolean
    type?: string
  }>(),
  { modelValue: '', placeholder: '', size: 'md', disabled: false, invalid: false, type: 'text' }
)

defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <input
    class="i-input"
    :class="[`i-input--${size}`, { 'is-invalid': invalid }]"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :type="type"
    :aria-invalid="invalid || undefined"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<style scoped>
.i-input {
  width: 100%;
  font-family: inherit;
  font-size: var(--i-font-size-md);
  color: var(--i-color-text);
  background: var(--i-color-bg);
  border: 1px solid var(--i-color-border-strong);
  border-radius: var(--i-radius-md);
  transition: border-color var(--i-motion-fast) var(--i-motion-easing),
    box-shadow var(--i-motion-fast) var(--i-motion-easing);
}
.i-input::placeholder { color: var(--i-color-text-tertiary); }
.i-input:hover:not(:disabled) { border-color: var(--i-color-brand); }
.i-input:focus {
  outline: none;
  border-color: var(--i-color-brand);
  box-shadow: 0 0 0 2px var(--i-color-brand-subtle);
}
.i-input:disabled {
  background: var(--i-color-bg-muted);
  cursor: not-allowed;
  color: var(--i-color-text-tertiary);
}
.i-input.is-invalid { border-color: var(--i-color-danger); }
.i-input.is-invalid:focus { box-shadow: 0 0 0 2px var(--i-color-danger-subtle); }

.i-input--sm { height: 28px; padding: 0 var(--i-spacing-2); font-size: var(--i-font-size-sm); }
.i-input--md { height: 34px; padding: 0 var(--i-spacing-3); }
.i-input--lg { height: 42px; padding: 0 var(--i-spacing-4); font-size: var(--i-font-size-lg); }
</style>
