<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import IIcon from './IIcon.vue'
import { backTopFrame, rafThrottle, shouldShowBackTop } from '@i-design/common'

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

/* 每帧最多算一次，合并逻辑走公共层——这个仓库里曾有五份各自手写的版本 */
const onScroll = rafThrottle(() => {
  visible.value = shouldShowBackTop(window.scrollY, window.innerHeight, props.threshold)
})

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
  onScroll.cancel()
})
</script>

<template>
  <Transition name="i-backtop">
    <button v-if="visible" class="i-backtop" type="button" aria-label="回到顶部" @click="toTop">
      <slot><IIcon name="chevron-up" :size="18" /></slot>
    </button>
  </Transition>
</template>
