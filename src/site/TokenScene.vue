<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { SceneHandle } from './tokenScene'

const props = withDefaults(defineProps<{ height?: number }>(), { height: 320 })

const canvas = ref<HTMLCanvasElement | null>(null)
const root = ref<HTMLElement | null>(null)
/** 起不来就退回静态插画：三维是锦上添花，不该成为首屏能否呈现的前提 */
const failed = ref(false)
let handle: SceneHandle | null = null
let io: IntersectionObserver | null = null
let themeWatcher: MutationObserver | null = null

/*
 * 值不值得下载这份运行时，先问三个问题。
 *
 * 它是首屏最重的一块。对一个只想查某个组件用法的人来说，这份字节全是白付的——
 * 所以省流量模式、窄屏、以及跑不动 WebGL 的机器，一律退回静态插画。
 * 窄屏那条尤其要紧：手机既最可能计流量，屏幕又小到看不清这点体积感，
 * 却要付掉最大的一份代价。
 */
function worthLoading() {
  try {
    const probe = document.createElement('canvas')
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return false
  } catch {
    return false
  }
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return false
  return window.innerWidth >= 900
}

async function boot() {
  if (handle || failed.value || !canvas.value) return
  try {
    const { createTokenScene } = await import('./tokenScene')
    handle = await createTokenScene(canvas.value, {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })
    if (!handle) {
      failed.value = true
      return
    }
    /*
     * 主题与品牌色都写在 :root 上——前者是 data-theme，后者是主题面板写进去的
     * 内联自定义属性。直接盯这两样，而不是去 import 那两个模块：
     * 场景不该知道站点是怎么管理主题的，它只需要知道「令牌变了」。
     */
    themeWatcher = new MutationObserver(() => handle?.retheme())
    themeWatcher.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style']
    })
  } catch {
    // 拉不到 chunk（离线、被拦）也走静态插画，不留一块空白
    failed.value = true
  }
}

function onPointerMove(event: PointerEvent) {
  const rect = root.value?.getBoundingClientRect()
  if (!rect || !handle) return
  handle.point(
    ((event.clientX - rect.left) / rect.width - 0.5) * 2,
    ((event.clientY - rect.top) / rect.height - 0.5) * 2
  )
}

function onLeave() {
  handle?.point(0, 0)
}

const onVisibility = () => handle?.setPaused(document.hidden)

onMounted(() => {
  if (!worthLoading()) {
    failed.value = true
    return
  }
  /*
   * 滚到跟前才加载。三维运行时是这个站里最大的一块，
   * 没看到就下载它，等于让每个只想查一个组件用法的人替首屏的观感买单。
   */
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // 离开视口就停掉渲染循环：看不见的画面不值得占着 GPU
        handle?.setPaused(!entry.isIntersecting)
        if (entry.isIntersecting) boot()
      }
    },
    { rootMargin: '200px' }
  )
  if (root.value) io.observe(root.value)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  io?.disconnect()
  themeWatcher?.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
  handle?.dispose()
  handle = null
})

defineExpose({ failed })
</script>

<template>
  <div
    ref="root"
    class="token-scene"
    :style="{ height: `${height}px` }"
    @pointermove="onPointerMove"
    @pointerleave="onLeave"
  >
    <!--
      三维部分对读屏没有信息量，整块隐藏；它旁边那张卡片才是真正要读的内容。
      隐藏比编一段「一个蓝色的立方体」的替代文字诚实——后者只会占用读屏的时间。
    -->
    <canvas v-show="!failed" ref="canvas" class="token-scene__canvas" aria-hidden="true" />
    <slot v-if="failed" name="fallback" />
  </div>
</template>

<style scoped>
.token-scene { position: relative; width: 100%; }
.token-scene__canvas { display: block; width: 100%; height: 100%; }
</style>
