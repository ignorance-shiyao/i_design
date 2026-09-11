<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IButtonGroup.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 一组紧挨着的按钮，表达「同一类操作的几个变体」。
 *
 * 只负责把相接的边拼好（去圆角、边框合成一条），按钮本身仍是 IButton——
 * 组合件不该重新实现被组合的那个东西。
 */
</script>

<template>
  <div class="i-button-group" role="group">
    <slot />
  </div>
</template>
