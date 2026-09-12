<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IButton.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useConfig } from './useConfig'
const props = withDefaults(
  defineProps<{
    /** 视觉层级：主按钮 / 次按钮 / 文字按钮 / 危险操作 */
    variant?: 'primary' | 'secondary' | 'text' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    block?: boolean
  }>(),
  { variant: 'secondary', disabled: false, loading: false, block: false }
)

/*
 * 尺寸跟随 ConfigProvider，但组件自己传了就以自己的为准。
 * 与文案字典同一条规则：全局配置是兜底，不是强制。
 *
 * 所以 size 不能写进 withDefaults——写了就分不清「没传」与「传了 md」，
 * 而这两者在这里的行为不同。下面这个同名计算属性在模板里会盖住那个属性。
 */
const { size: configSize } = useConfig()
const size = computed(() => props.size ?? configSize.value)

defineEmits<{ (e: 'click', a0: MouseEvent): void }>()
</script>

<template>
  <button
    class="i-button"
    :class="[`i-button--${variant}`, `i-button--${size}`, { 'is-block': block, 'is-loading': loading }]"
    :disabled="disabled || loading"
    type="button"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="i-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>
