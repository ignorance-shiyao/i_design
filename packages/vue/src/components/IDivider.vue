<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IDivider.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
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
