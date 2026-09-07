<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IButton.vue 转换而来。
  差异仅在 Vue 2 的语法约束（v-model 用 value/input、模板需单根），行为保持一致。
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 视觉层级：主按钮 / 次按钮 / 文字按钮 / 危险操作 */
    variant?: 'primary' | 'secondary' | 'text' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    block?: boolean
  }>(),
  { variant: 'secondary', size: 'md', disabled: false, loading: false, block: false }
)

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
