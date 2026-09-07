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
