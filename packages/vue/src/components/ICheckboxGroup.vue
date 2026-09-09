<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ICheckboxGroup.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, provide } from 'vue'
import { checkboxGroupKey } from './context'

const props = withDefaults(
  defineProps<{
    value?: (string | number)[]
    disabled?: boolean
    /** 最多可选数量，达到后未选中项自动禁用 */
    max?: number
    direction?: 'horizontal' | 'vertical'
  }>(),
  { value: () => [], disabled: false, max: undefined, direction: 'horizontal' }
)

const emit = defineEmits<{ (e: 'input', a0: (string | number)[]): void; (e: 'change', a0: (string | number)[]): void }>()

provide(checkboxGroupKey, {
  value: computed(() => props.value),
  disabled: computed(() => props.disabled),
  atMax: computed(() => props.max !== undefined && props.value.length >= props.max),
  toggle: (value, checked) => {
    const next = checked
      ? [...props.value, value]
      : props.value.filter((v) => v !== value)
    emit('input', next)
    emit('change', next)
  }
})
</script>

<template>
  <div class="i-checkbox-group" :class="`is-${direction}`" role="group">
    <slot />
  </div>
</template>
