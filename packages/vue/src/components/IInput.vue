<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IInput.vue 转换而来。
  差异仅在 Vue 2 的语法约束（v-model 用 value/input、模板需单根），行为保持一致。
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    value?: string
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    invalid?: boolean
    type?: string
  }>(),
  { value: '', placeholder: '', size: 'md', disabled: false, invalid: false, type: 'text' }
)

defineEmits<{ (e: 'input', a0: string): void }>()
</script>

<template>
  <input
    class="i-input"
    :class="[`i-input--${size}`, { 'is-invalid': invalid }]"
    :value="value"
    :placeholder="placeholder"
    :disabled="disabled"
    :type="type"
    :aria-invalid="invalid || undefined"
    @input="$emit('input', ($event.target).value)"
  />
</template>
