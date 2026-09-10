<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  clampWindow,
  linePath,
  panWindow,
  windowFromRatio,
  windowRatio,
  type ZoomWindow
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 全量数据，只用来画缩略走势 */
    values: number[]
    labels?: string[]
    /** 窗口最少包含几个点 */
    minSpan?: number
    height?: number
  }>(),
  { labels: () => [], minSpan: 3, height: 48 }
)

const win = defineModel<ZoomWindow>('window', {
  default: () => ({ start: 0, end: 0 })
})

const track = ref<HTMLElement>()
const W = 640

/* 缩略走势：只表达形状，不需要坐标轴——它的作用是让人知道自己拖到了哪一段 */
const preview = computed(() => {
  const vs = props.values
  if (vs.length < 2) return ''
  const min = Math.min(...vs)
  const max = Math.max(...vs)
  // 上下各留 6px：贴着边缘的折线看起来像被裁掉了
  return linePath(vs, min, max === min ? min + 1 : max, W, props.height - 12)
})

const ratio = computed(() => windowRatio(win.value, props.values.length))
const leftPct = computed(() => `${ratio.value.from * 100}%`)
const widthPct = computed(() => `${(ratio.value.to - ratio.value.from) * 100}%`)

const rangeText = computed(() => {
  if (!props.labels.length) return `${win.value.start + 1} – ${win.value.end + 1}`
  return `${props.labels[win.value.start] ?? ''} – ${props.labels[win.value.end] ?? ''}`
})

type DragMode = 'left' | 'right' | 'move' | null
let mode: DragMode = null
let originX = 0
let originWin: ZoomWindow = { start: 0, end: 0 }

function ratioAt(clientX: number) {
  const box = track.value?.getBoundingClientRect()
  if (!box) return 0
  return Math.min(1, Math.max(0, (clientX - box.left) / box.width))
}

function onDown(next: DragMode, event: PointerEvent) {
  mode = next
  originX = event.clientX
  originWin = { ...win.value }
  ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
  event.preventDefault()
}

function onMove(event: PointerEvent) {
  if (!mode) return
  const count = props.values.length
  if (mode === 'move') {
    const box = track.value?.getBoundingClientRect()
    if (!box) return
    // 位移换算成下标增量：按像素直接改下标会让长序列拖不动、短序列一拖就飞
    const delta = ((event.clientX - originX) / box.width) * Math.max(1, count - 1)
    win.value = panWindow(originWin, delta, count)
    return
  }
  const r = ratioAt(event.clientX)
  const other = mode === 'left' ? ratio.value.to : ratio.value.from
  win.value = windowFromRatio(Math.min(r, other), Math.max(r, other), count, props.minSpan)
}

function onUp() {
  mode = null
}

/* 键盘：手柄要能不靠鼠标操作，方向键移动、Home/End 归位 */
function onKey(which: 'left' | 'right', event: KeyboardEvent) {
  const count = props.values.length
  const step = event.shiftKey ? 5 : 1
  const dir = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
  if (!dir && event.key !== 'Home' && event.key !== 'End') return
  event.preventDefault()

  const next = { ...win.value }
  if (event.key === 'Home') next[which === 'left' ? 'start' : 'end'] = 0
  else if (event.key === 'End') next[which === 'left' ? 'start' : 'end'] = count - 1
  else next[which === 'left' ? 'start' : 'end'] += dir
  win.value = clampWindow(next, count, props.minSpan)
}

function reset() {
  win.value = clampWindow({ start: 0, end: props.values.length - 1 }, props.values.length, props.minSpan)
}

window.addEventListener('pointermove', onMove)
window.addEventListener('pointerup', onUp)
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
})
</script>

<template>
  <div class="i-zoom">
    <div ref="track" class="i-zoom__track" :style="{ height: `${height}px` }">
      <svg class="i-zoom__preview" :viewBox="`0 0 ${W} ${height}`" preserveAspectRatio="none" aria-hidden="true">
        <path :d="preview" />
      </svg>

      <!-- 窗口之外压暗：被排除的区间仍然可见，用户才知道自己漏看了什么 -->
      <div class="i-zoom__mask" :style="{ left: 0, width: leftPct }" />
      <div class="i-zoom__mask" :style="{ left: `calc(${leftPct} + ${widthPct})`, right: 0 }" />

      <div
        class="i-zoom__window"
        :style="{ left: leftPct, width: widthPct }"
        @pointerdown="onDown('move', $event)"
      >
        <span
          class="i-zoom__handle is-left"
          role="slider"
          tabindex="0"
          :aria-valuemin="0"
          :aria-valuemax="values.length - 1"
          :aria-valuenow="win.start"
          aria-label="起点"
          @pointerdown.stop="onDown('left', $event)"
          @keydown="onKey('left', $event)"
        />
        <span
          class="i-zoom__handle is-right"
          role="slider"
          tabindex="0"
          :aria-valuemin="0"
          :aria-valuemax="values.length - 1"
          :aria-valuenow="win.end"
          aria-label="终点"
          @pointerdown.stop="onDown('right', $event)"
          @keydown="onKey('right', $event)"
        />
      </div>
    </div>

    <div class="i-zoom__foot">
      <span class="i-zoom__range">{{ rangeText }}</span>
      <button class="i-zoom__reset" @click="reset">重置</button>
    </div>
  </div>
</template>
