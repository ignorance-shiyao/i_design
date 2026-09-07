<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    rows?: number
    maxlength?: number
    disabled?: boolean
    invalid?: boolean
    /** 显示 已输入/上限 计数，需配合 maxlength */
    showCount?: boolean
    resize?: 'none' | 'vertical' | 'both'
  }>(),
  {
    modelValue: '',
    placeholder: '',
    rows: 3,
    maxlength: undefined,
    disabled: false,
    invalid: false,
    showCount: false,
    resize: 'vertical'
  }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const overLimit = computed(
  () => props.maxlength !== undefined && props.modelValue.length > props.maxlength
)
</script>

<template>
  <div class="i-textarea" :class="{ 'is-disabled': disabled }">
    <textarea
      class="i-textarea__inner"
      :class="{ 'is-invalid': invalid || overLimit }"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      :aria-invalid="invalid || overLimit || undefined"
      :style="{ resize }"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <span v-if="showCount && maxlength !== undefined" class="i-textarea__count" :class="{ 'is-over': overLimit }">
      {{ modelValue.length }} / {{ maxlength }}
    </span>
  </div>
</template>

<style scoped>
.i-textarea { position: relative; width: 100%; }
.i-textarea__inner {
  display: block;
  width: 100%;
  padding: var(--i-spacing-2) var(--i-spacing-3);
  font-family: inherit;
  font-size: var(--i-font-size-md);
  line-height: var(--i-line-height-base);
  color: var(--i-color-text);
  background: var(--i-color-bg);
  border: 1px solid var(--i-color-border-strong);
  border-radius: var(--i-radius-md);
  transition: border-color var(--i-motion-fast) var(--i-motion-easing),
    box-shadow var(--i-motion-fast) var(--i-motion-easing);
}
.i-textarea__inner::placeholder { color: var(--i-color-text-tertiary); }
.i-textarea__inner:hover:not(:disabled) { border-color: var(--i-color-brand); }
.i-textarea__inner:focus {
  outline: none;
  border-color: var(--i-color-brand);
  box-shadow: 0 0 0 2px var(--i-color-brand-subtle);
}
.i-textarea__inner:disabled {
  background: var(--i-color-bg-muted);
  color: var(--i-color-text-tertiary);
  cursor: not-allowed;
}
.i-textarea__inner.is-invalid { border-color: var(--i-color-danger); }
.i-textarea__inner.is-invalid:focus { box-shadow: 0 0 0 2px var(--i-color-danger-subtle); }

.i-textarea__count {
  position: absolute;
  right: var(--i-spacing-3);
  bottom: var(--i-spacing-2);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
  pointer-events: none;
}
.i-textarea__count.is-over { color: var(--i-color-danger); }
</style>
