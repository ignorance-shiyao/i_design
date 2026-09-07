<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISwitch.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
withDefaults(defineProps<{ value?: boolean; disabled?: boolean }>(), {
  value: false,
  disabled: false
})
defineEmits<{ (e: 'input', a0: boolean): void }>()
</script>

<template>
  <button
    class="i-switch"
    :class="{ 'is-checked': value }"
    type="button"
    role="switch"
    :aria-checked="String(value)"
    :disabled="disabled"
    @click="$emit('input', !value)"
  >
    <span class="i-switch__thumb" />
  </button>
</template>
