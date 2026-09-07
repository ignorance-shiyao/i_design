<script setup lang="ts">
import { computed, inject } from 'vue'
import { radioGroupKey } from './context'

/** 同 Checkbox：value 是「项的值」，选中态走 checked + change */
const props = withDefaults(
  defineProps<{
    checked?: boolean
    value: string | number | boolean
    disabled?: boolean
    variant?: 'default' | 'button'
  }>(),
  { checked: false, disabled: false, variant: 'default' }
)

const emit = defineEmits<{ (e: 'change', value: string | number | boolean): void }>()

const group = inject(radioGroupKey, null)

const isChecked = computed(() =>
  group ? group.value.value === props.value : props.checked
)
const isDisabled = computed(() => props.disabled || group?.disabled.value === true)
const variant = computed(() => (group ? group.variant.value : props.variant))
const name = computed(() => group?.name)

function pick() {
  if (isDisabled.value || isChecked.value) return
  if (group) group.change(props.value)
  else emit('change', props.value)
}
</script>

<template>
  <label
    class="i-radio"
    :class="[`i-radio--${variant}`, { 'is-checked': isChecked, 'is-disabled': isDisabled }]"
  >
    <input
      class="i-radio__input"
      type="radio"
      :name="name"
      :checked="isChecked"
      :disabled="isDisabled"
      @change="pick"
    />
    <span v-if="variant === 'default'" class="i-radio__mark" aria-hidden="true" />
    <span class="i-radio__label"><slot /></span>
  </label>
</template>
