<script setup lang="ts">
import { computed, provide } from 'vue'
import { checkboxGroupKey } from './context'

const props = withDefaults(
  defineProps<{
    modelValue?: (string | number)[]
    disabled?: boolean
    /** 最多可选数量，达到后未选中项自动禁用 */
    max?: number
    direction?: 'horizontal' | 'vertical'
  }>(),
  { modelValue: () => [], disabled: false, max: undefined, direction: 'horizontal' }
)

const emit = defineEmits<{
  'update:modelValue': [(string | number)[]]
  change: [(string | number)[]]
}>()

provide(checkboxGroupKey, {
  value: computed(() => props.modelValue),
  disabled: computed(() => props.disabled),
  atMax: computed(() => props.max !== undefined && props.modelValue.length >= props.max),
  toggle: (value, checked) => {
    const next = checked
      ? [...props.modelValue, value]
      : props.modelValue.filter((v) => v !== value)
    emit('update:modelValue', next)
    emit('change', next)
  }
})
</script>

<template>
  <div class="i-checkbox-group" :class="`is-${direction}`" role="group">
    <slot />
  </div>
</template>

<style scoped>
.i-checkbox-group { display: inline-flex; flex-wrap: wrap; gap: var(--i-spacing-5); }
.i-checkbox-group.is-vertical { flex-direction: column; gap: var(--i-spacing-3); }
</style>
