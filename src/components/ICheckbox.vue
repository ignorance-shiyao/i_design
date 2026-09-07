<script setup lang="ts">
import { computed, inject } from 'vue'
import IIcon from './IIcon.vue'
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
    <span class="i-checkbox__mark" aria-hidden="true">
      <IIcon v-if="checked && !indeterminate" name="check" :size="12" :stroke-width="3" />
      <span v-else-if="indeterminate" class="i-checkbox__dash" />
    </span>
    <span class="i-checkbox__label"><slot /></span>
  </label>
</template>
