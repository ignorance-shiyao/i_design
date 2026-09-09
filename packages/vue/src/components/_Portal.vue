<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Teleport 在 Vue 2.7 里不存在。
 * 这里在挂载后把自己的 DOM 节点搬到 body 下，卸载时移除——
 * 效果与 Teleport to="body" 一致：浮层不受祖先的 overflow / transform / z-index 影响。
 */
const props = withDefaults(defineProps<{ to?: string; disabled?: boolean }>(), {
  to: 'body',
  disabled: false
})

const root = ref<HTMLElement | null>(null)
let placed: HTMLElement | null = null

onMounted(() => {
  if (props.disabled || !root.value) return
  const target = document.querySelector(props.to)
  if (!target) return
  placed = root.value
  target.appendChild(placed)
})

onBeforeUnmount(() => {
  // 组件卸载时 Vue 只会移除它在原位置的占位，被搬走的节点要自己清理
  placed?.parentNode?.removeChild(placed)
  placed = null
})
</script>

<template>
  <div ref="root" class="i-portal"><slot /></div>
</template>

<style>
/* 传送出去的容器本身不参与布局，只作为浮层的挂载点 */
.i-portal { display: contents; }
</style>
