<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISpace.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical'
    size?: 'sm' | 'md' | 'lg'
    align?: 'start' | 'center' | 'end' | 'between'
    wrap?: boolean
    /** 占满一行；默认是行内元素 */
    block?: boolean
  }>(),
  { direction: 'horizontal', size: 'md', align: 'start', wrap: false, block: false }
)
</script>

<template>
  <div
    class="i-space"
    :class="[
      `i-space--${direction}`,
      `i-space--${size}`,
      `i-space--${align}`,
      { 'is-wrap': wrap, 'is-block': block }
    ]"
  >
    <slot />
  </div>
</template>
