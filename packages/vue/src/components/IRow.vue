<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IRow.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 列间距（px），由行统一控制，列自己不设间距 */
    gutter?: number
    align?: 'top' | 'middle' | 'bottom'
    justify?: 'start' | 'center' | 'end' | 'between'
  }>(),
  { gutter: 16, align: 'top', justify: 'start' }
)

// 间距通过 CSS 变量往下传，列直接读它，不必再走一遍 provide / inject——
// 少一条 JS 通道，列就能被单独拿出来用在任何容器里
const style = computed(() => ({ '--i-row-gutter': `${props.gutter}px` }))
</script>

<template>
  <div class="i-row" :class="[`i-row--${align}`, `i-row--${justify}`]" :style="style">
    <slot />
  </div>
</template>
