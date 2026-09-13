<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: boolean
    disabled?: boolean
    /**
     * 无障碍名。
     *
     * 开关本身只是一个圆点，读屏用户听到的是「开关，未选中」——开的是什么全靠猜。
     * 旁边有可见文字时，用 `<label>` 包起来或指向它即可；没有时必须给这个属性。
     */
    ariaLabel?: string
  }>(),
  { modelValue: false, disabled: false, ariaLabel: '' }
)
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button
    class="i-switch"
    :class="{ 'is-checked': modelValue }"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel || undefined"
    :disabled="disabled"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="i-switch__thumb" />
  </button>
</template>
