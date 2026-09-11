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
