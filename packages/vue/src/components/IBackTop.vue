<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IBackTop.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import IIcon from './IIcon.vue'
import { backTopFrame, shouldShowBackTop } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 滚过多少像素才露出来。不传则用一屏高 */
    threshold?: number
    /** 回顶动画时长 */
    duration?: number
  }>(),
  { threshold: undefined, duration: 320 }
)

const visible = ref(false)
let frame = 0

function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    visible.value = shouldShowBackTop(window.scrollY, window.innerHeight, props.threshold)
  })
}

/*
 * 自己算每一帧，而不是 scrollTo({ behavior: 'smooth' })。
 * 后者的时长由浏览器按距离决定，长页面上会滚十几秒，用户以为卡住了；
 * 这里按固定时长走完，页面再长也一样快。
 */
function toTop() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, 0)
    return
  }
  const from = window.scrollY
  const started = performance.now()
  const step = (now: number) => {
    const y = backTopFrame(from, now - started, props.duration)
    window.scrollTo(0, y)
    if (y > 0) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <Transition name="i-backtop">
    <button v-if="visible" class="i-backtop" type="button" aria-label="回到顶部" @click="toTop">
      <slot><IIcon name="chevron-up" :size="18" /></slot>
    </button>
  </Transition>
</template>
