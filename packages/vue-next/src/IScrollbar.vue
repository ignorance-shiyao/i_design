<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { rafThrottle, scrollThumb, scrollTopOfThumb } from '@i-design/common'

/**
 * 自绘滚动条。
 *
 * Windows 的系统滚动条是一条 17px 宽的灰槽，会把右侧内容挤窄，而 macOS 上默认不占位——
 * 同一份布局在两个系统上看到的宽度不一样。自绘的浮在内容之上、不占布局，两边就一致了。
 *
 * 滚动本身仍交给浏览器：滚轮惯性、触控板、键盘与无障碍工具都指望原生滚动，
 * 我们只是把那条槽藏起来、另画一条。
 */
const props = withDefaults(
  defineProps<{ height?: string; maxHeight?: string; always?: boolean }>(),
  { height: '', maxHeight: '', always: false }
)

const view = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const metrics = ref({ scrollTop: 0, clientHeight: 0, scrollHeight: 0 })
const trackLength = ref(0)
const dragging = ref(false)

const thumb = computed(() => scrollThumb(metrics.value, trackLength.value))

function measure() {
  const el = view.value
  if (!el) return
  metrics.value = {
    scrollTop: el.scrollTop,
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight
  }
  trackLength.value = track.value?.clientHeight ?? 0
}

/* 合并到每帧一次：滚动事件远多于帧，而这里每次都要读三个布局值 */
const onScroll = rafThrottle(measure)

let observer: ResizeObserver | null = null
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (view.value) observer.observe(view.value)
  // 内容高度变化同样要重算：子节点增减不会触发容器的 resize
  const child = view.value?.firstElementChild
  if (child) observer.observe(child)
})
onBeforeUnmount(() => {
  onScroll.cancel()
  observer?.disconnect()
  stopDrag()
})

let startY = 0
let startOffset = 0

function onThumbDown(event: PointerEvent) {
  dragging.value = true
  startY = event.clientY
  startOffset = thumb.value.offset
  ;(event.target as Element).setPointerCapture(event.pointerId)
  document.addEventListener('pointermove', onDragMove)
  document.addEventListener('pointerup', stopDrag)
}

function onDragMove(event: PointerEvent) {
  if (!dragging.value || !view.value) return
  const offset = startOffset + (event.clientY - startY)
  view.value.scrollTop = scrollTopOfThumb(
    offset,
    thumb.value.size,
    trackLength.value,
    metrics.value
  )
}

function stopDrag() {
  dragging.value = false
  document.removeEventListener('pointermove', onDragMove)
  document.removeEventListener('pointerup', stopDrag)
}

/* 点轨道空白处：跳到对应位置，而不是翻一页——手指点哪就去哪更符合直觉 */
function onTrackDown(event: PointerEvent) {
  if (event.target !== track.value || !view.value || !track.value) return
  const rect = track.value.getBoundingClientRect()
  const offset = event.clientY - rect.top - thumb.value.size / 2
  view.value.scrollTop = scrollTopOfThumb(
    offset,
    thumb.value.size,
    trackLength.value,
    metrics.value
  )
}
</script>

<template>
  <div
    class="i-scrollbar"
    :class="{ 'is-dragging': dragging, 'is-always': always }"
    :style="{ height: height || undefined, maxHeight: maxHeight || undefined }"
  >
    <!-- 可滚动区域要能用键盘滚：不给 tabindex，只用键盘的人根本进不到这块内容里 -->
    <div
      ref="view"
      class="i-scrollbar__view"
      tabindex="0"
      :style="{ maxHeight: maxHeight || undefined }"
      @scroll.passive="onScroll"
    >
      <slot />
    </div>

    <div
      ref="track"
      class="i-scrollbar__track"
      @pointerdown="onTrackDown"
    >
      <div
        v-show="thumb.visible"
        class="i-scrollbar__thumb"
        :style="{ height: `${thumb.size}px`, transform: `translateY(${thumb.offset}px)` }"
        @pointerdown.stop="onThumbDown"
      />
    </div>
  </div>
</template>
