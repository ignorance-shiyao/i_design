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

defineEmits<{ click: [MouseEvent] }>()
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
