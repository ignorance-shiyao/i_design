<script setup lang="ts">
import { computed, inject } from 'vue'
import IIcon from './IIcon.vue'
import { checkboxGroupKey } from './context'

/**
 * Vue 2 的取舍：`value` 表示「组内该项的值」是原生 checkbox 的约定，
 * 因此选中态改用 `checked` + `change`，而不是把 modelValue 改名成 value——
 * 那样两个含义会撞在同一个属性上。
 */
const props = withDefaults(
  defineProps<{
    /** 单独使用时的选中态 */
    checked?: boolean
    /** 置于 CheckboxGroup 内时作为该项的值 */
    value?: string | number
    disabled?: boolean
    /** 半选态，仅影响视觉，常用于「全选」父项 */
    indeterminate?: boolean
  }>(),
  { checked: false, value: undefined, disabled: false, indeterminate: false }
)

const emit = defineEmits<{ (e: 'change', value: boolean): void }>()

const group = inject(checkboxGroupKey, null)

const isChecked = computed(() =>
  group && props.value !== undefined ? group.value.value.includes(props.value) : props.checked
)

const isDisabled = computed(() => {
  if (props.disabled || group?.disabled.value) return true
  // 达到 max 后未选中项不可再勾选，已选中的仍可取消
  return Boolean(group?.atMax.value && !isChecked.value)
})

function toggle() {
  if (isDisabled.value) return
  const next = !isChecked.value
  if (group && props.value !== undefined) group.toggle(props.value, next)
  else emit('change', next)
}
</script>

<template>
  <label
    class="i-checkbox"
    :class="{ 'is-checked': isChecked, 'is-disabled': isDisabled, 'is-indeterminate': indeterminate }"
  >
    <input
      class="i-checkbox__input"
      type="checkbox"
      :checked="isChecked"
      :disabled="isDisabled"
      :aria-checked="indeterminate ? 'mixed' : String(isChecked)"
      @change="toggle"
    />
    <span class="i-checkbox__mark" aria-hidden="true">
      <IIcon v-if="isChecked && !indeterminate" name="check" :size="12" :stroke-width="3" />
      <span v-else-if="indeterminate" class="i-checkbox__dash" />
    </span>
    <span class="i-checkbox__label"><slot /></span>
  </label>
</template>
