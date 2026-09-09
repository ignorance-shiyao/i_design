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
