<script setup lang="ts">
import { computed, inject } from 'vue'
import { radioGroupKey } from './context'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean
    value: string | number | boolean
    disabled?: boolean
    /** 按钮形态，用于工具栏或筛选条 */
    variant?: 'default' | 'button'
  }>(),
  { modelValue: undefined, disabled: false, variant: 'default' }
)

const emit = defineEmits<{ 'update:modelValue': [string | number | boolean] }>()

const group = inject(radioGroupKey, null)

const checked = computed(() =>
  group ? group.value.value === props.value : props.modelValue === props.value
)
const disabled = computed(() => props.disabled || group?.disabled.value === true)
const variant = computed(() => (group ? group.variant.value : props.variant))
const name = computed(() => group?.name)

function pick() {
  if (disabled.value || checked.value) return
  if (group) group.change(props.value)
  else emit('update:modelValue', props.value)
}
</script>

<template>
  <label
    class="i-radio"
    :class="[`i-radio--${variant}`, { 'is-checked': checked, 'is-disabled': disabled }]"
  >
    <input
      class="i-radio__input"
      type="radio"
      :name="name"
      :checked="checked"
      :disabled="disabled"
      @change="pick"
    />
    <span v-if="variant === 'default'" class="i-radio__mark" aria-hidden="true" />
    <span class="i-radio__label"><slot /></span>
  </label>
</template>

<style scoped>
.i-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  cursor: pointer;
  color: var(--i-color-text);
  font-size: var(--i-font-size-md);
}
.i-radio.is-disabled { cursor: not-allowed; color: var(--i-color-text-tertiary); }

/* 原生 input 保留在可访问性树中，仅在视觉上隐藏 */
.i-radio__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  margin: 0;
}

.i-radio--default .i-radio__mark {
  position: relative;
  width: 16px;
  height: 16px;
  border: 1px solid var(--i-color-border-strong);
  border-radius: var(--i-radius-full);
  background: var(--i-color-bg);
  transition: border-color var(--i-motion-fast) var(--i-motion-easing);
}
.i-radio--default:hover:not(.is-disabled) .i-radio__mark { border-color: var(--i-color-brand); }
.i-radio--default.is-checked .i-radio__mark { border-color: var(--i-color-brand); }
.i-radio--default.is-checked .i-radio__mark::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: var(--i-radius-full);
  background: var(--i-color-brand);
}
.i-radio--default.is-disabled .i-radio__mark { background: var(--i-color-bg-muted); }
.i-radio__input:focus-visible + .i-radio__mark {
  outline: 2px solid var(--i-color-brand);
  outline-offset: 2px;
}

.i-radio--button {
  padding: 0 var(--i-spacing-4);
  height: 34px;
  border: 1px solid var(--i-color-border-strong);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg);
  transition: all var(--i-motion-fast) var(--i-motion-easing);
}
.i-radio--button:hover:not(.is-disabled) { color: var(--i-color-brand); border-color: var(--i-color-brand); }
.i-radio--button.is-checked {
  background: var(--i-color-brand);
  border-color: var(--i-color-brand);
  color: #fff;
}
.i-radio--button.is-disabled { background: var(--i-color-bg-muted); }
.i-radio--button:focus-within { outline: 2px solid var(--i-color-brand); outline-offset: 2px; }
</style>
