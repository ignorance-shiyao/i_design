<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IRadioGroup.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import { radioGroupKey } from './context'

const props = withDefaults(
  defineProps<{
    value?: string | number | boolean
    disabled?: boolean
    variant?: 'default' | 'button'
    /** 排列方向；纵向适合选项文案较长的场景 */
    direction?: 'horizontal' | 'vertical'
  }>(),
  { value: undefined, disabled: false, variant: 'default', direction: 'horizontal' }
)

const emit = defineEmits<{ (e: 'input', a0: string | number | boolean): void; (e: 'change', a0: string | number | boolean): void }>()

let seed = 0
provide(radioGroupKey, {
  value: toRef(props, 'value'),
  disabled: computed(() => props.disabled),
  variant: computed(() => props.variant),
  // 同名 name 让原生单选语义生效，方向键在同组内切换
  name: `i-radio-group-${++seed}-${Math.random().toString(36).slice(2, 8)}`,
  change: (value) => {
    emit('input', value)
    emit('change', value)
  }
})
</script>

<template>
  <div class="i-radio-group" :class="`is-${direction}`" role="radiogroup">
    <slot />
  </div>
</template>
