<script setup lang="ts">
withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical'
    /** 带文字时的对齐位置 */
    align?: 'left' | 'center' | 'right'
    dashed?: boolean
  }>(),
  { direction: 'horizontal', align: 'center', dashed: false }
)
</script>

<template>
  <div
    class="i-divider"
    :class="[`i-divider--${direction}`, `is-${align}`, { 'is-dashed': dashed, 'has-text': !!$slots.default }]"
    role="separator"
  >
    <span v-if="$slots.default && direction === 'horizontal'" class="i-divider__text"><slot /></span>
  </div>
</template>
