<script setup lang="ts">
import { computed, inject } from 'vue'
import { checkboxGroupKey } from './context'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /** 置于 CheckboxGroup 内时作为该项的值 */
    value?: string | number
    disabled?: boolean
    /** 半选态，仅影响视觉，常用于「全选」父项 */
    indeterminate?: boolean
  }>(),
  { modelValue: false, value: undefined, disabled: false, indeterminate: false }
)

const emit = defineEmits<{ 'update:modelValue': [boolean]; change: [boolean] }>()

const group = inject(checkboxGroupKey, null)

const checked = computed(() =>
  group && props.value !== undefined ? group.value.value.includes(props.value) : props.modelValue
)
const disabled = computed(() => {
  if (props.disabled || group?.disabled.value) return true
  // 达到 max 后，未选中的项不可再勾选，已选中的仍可取消
  return Boolean(group?.atMax.value && !checked.value)
})

function toggle() {
  if (disabled.value) return
  const next = !checked.value
  if (group && props.value !== undefined) group.toggle(props.value, next)
  else {
    emit('update:modelValue', next)
    emit('change', next)
  }
}
</script>

<template>
  <label
    class="i-checkbox"
    :class="{ 'is-checked': checked, 'is-disabled': disabled, 'is-indeterminate': indeterminate }"
  >
    <input
      class="i-checkbox__input"
      type="checkbox"
      :checked="checked"
      :disabled="disabled"
      :aria-checked="indeterminate ? 'mixed' : checked"
      @change="toggle"
    />
    <span class="i-checkbox__mark" aria-hidden="true" />
    <span class="i-checkbox__label"><slot /></span>
  </label>
</template>

<style scoped>
.i-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  cursor: pointer;
  color: var(--i-color-text);
  font-size: var(--i-font-size-md);
}
.i-checkbox.is-disabled { cursor: not-allowed; color: var(--i-color-text-tertiary); }

.i-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  margin: 0;
}

.i-checkbox__mark {
  position: relative;
  width: 16px;
  height: 16px;
  border: 1px solid var(--i-color-border-strong);
  border-radius: var(--i-radius-sm);
  background: var(--i-color-bg);
  transition: background var(--i-motion-fast) var(--i-motion-easing),
    border-color var(--i-motion-fast) var(--i-motion-easing);
}
.i-checkbox:hover:not(.is-disabled) .i-checkbox__mark { border-color: var(--i-color-brand); }
.i-checkbox.is-checked .i-checkbox__mark,
.i-checkbox.is-indeterminate .i-checkbox__mark {
  background: var(--i-color-brand);
  border-color: var(--i-color-brand);
}
/* 勾：用两条边构成对勾，避免依赖图标字体 */
.i-checkbox.is-checked:not(.is-indeterminate) .i-checkbox__mark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 4px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.i-checkbox.is-indeterminate .i-checkbox__mark::after {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  top: 6px;
  height: 2px;
  background: #fff;
}
.i-checkbox.is-disabled .i-checkbox__mark { background: var(--i-color-bg-muted); }
.i-checkbox.is-disabled.is-checked .i-checkbox__mark,
.i-checkbox.is-disabled.is-indeterminate .i-checkbox__mark {
  background: var(--i-color-border-strong);
  border-color: var(--i-color-border-strong);
}
.i-checkbox__input:focus-visible + .i-checkbox__mark {
  outline: 2px solid var(--i-color-brand);
  outline-offset: 2px;
}
</style>
