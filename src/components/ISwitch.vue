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

<style scoped>
.i-switch {
  position: relative;
  width: 40px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: var(--i-radius-full);
  background: var(--i-color-border-strong);
  cursor: pointer;
  transition: background var(--i-motion-base) var(--i-motion-easing);
}
.i-switch:disabled { opacity: 0.5; cursor: not-allowed; }
.i-switch.is-checked { background: var(--i-color-brand); }
.i-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: var(--i-radius-full);
  background: #fff;
  box-shadow: var(--i-shadow-sm);
  transition: transform var(--i-motion-base) var(--i-motion-easing);
}
.i-switch.is-checked .i-switch__thumb { transform: translateX(18px); }
</style>
