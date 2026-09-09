<script setup lang="ts">
withDefaults(defineProps<{ modelValue?: boolean; disabled?: boolean }>(), {
  modelValue: false,
  disabled: false
})
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button
    class="i-switch"
    :class="{ 'is-checked': modelValue }"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="i-switch__thumb" />
  </button>
</template>
