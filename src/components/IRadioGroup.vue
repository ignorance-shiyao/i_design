<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import { radioGroupKey } from './context'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean
    disabled?: boolean
    variant?: 'default' | 'button'
    /** 排列方向；纵向适合选项文案较长的场景 */
    direction?: 'horizontal' | 'vertical'
  }>(),
  { modelValue: undefined, disabled: false, variant: 'default', direction: 'horizontal' }
)

const emit = defineEmits<{
  'update:modelValue': [string | number | boolean]
  change: [string | number | boolean]
}>()

let seed = 0
provide(radioGroupKey, {
  value: toRef(props, 'modelValue'),
  disabled: computed(() => props.disabled),
  variant: computed(() => props.variant),
  // 同名 name 让原生单选语义生效，方向键在同组内切换
  name: `i-radio-group-${++seed}-${Math.random().toString(36).slice(2, 8)}`,
  change: (value) => {
    emit('update:modelValue', value)
    emit('change', value)
  }
})
</script>

<template>
  <div class="i-radio-group" :class="`is-${direction}`" role="radiogroup">
    <slot />
  </div>
</template>

<style scoped>
.i-radio-group { display: inline-flex; gap: var(--i-spacing-5); }
.i-radio-group.is-vertical { flex-direction: column; gap: var(--i-spacing-3); }
</style>
