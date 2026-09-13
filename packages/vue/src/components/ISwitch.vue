<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISwitch.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    value?: boolean
    disabled?: boolean
    /**
     * 无障碍名。
     *
     * 开关本身只是一个圆点，读屏用户听到的是「开关，未选中」——开的是什么全靠猜。
     * 旁边有可见文字时，用 `<label>` 包起来或指向它即可；没有时必须给这个属性。
     */
    ariaLabel?: string
  }>(),
  { value: false, disabled: false, ariaLabel: '' }
)
defineEmits<{ (e: 'input', a0: boolean): void }>()
</script>

<template>
  <button
    class="i-switch"
    :class="{ 'is-checked': value }"
    type="button"
    role="switch"
    :aria-checked="String(value)"
    :aria-label="ariaLabel || undefined"
    :disabled="disabled"
    @click="$emit('input', !value)"
  >
    <span class="i-switch__thumb" />
  </button>
</template>
