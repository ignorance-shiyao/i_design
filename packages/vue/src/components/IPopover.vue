<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { resolveOverlay, type Placement } from '@i-design/common'
import IPortal from './_Portal.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    content?: string
    placement?: Placement
    /** 点击触发适合承载可交互内容，悬浮适合纯说明 */
    trigger?: 'click' | 'hover'
    disabled?: boolean
  }>(),
  { title: '', content: '', placement: 'top', trigger: 'click', disabled: false }
)

const visible = ref(false)
const triggerEl = ref<HTMLElement>()
const popupEl = ref<HTMLElement>()
const pos = ref({ x: 0, y: 0, placement: props.placement, arrow: 0 })
// Vue 2.7 没有 useId
let seed = 0
const id = `i-popover-${++seed}-${Math.random().toString(36).slice(2, 7)}`
let timer: ReturnType<typeof setTimeout> | undefined

/*
 * 定位必须在浮层渲染出来之后算——尺寸未知时无法判断放不放得下。
 * 这里等一帧再量，比预估尺寸准确，也避免了「首次打开位置不对、第二次才对」。
 */
async function place() {
  await new Promise(requestAnimationFrame)
  const t = triggerEl.value?.getBoundingClientRect()
  const p = popupEl.value?.getBoundingClientRect()
  if (!t || !p) return
  pos.value = resolveOverlay({
    trigger: t,
    popup: p,
    viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
    placement: props.placement
  })
}

function open() {
  if (props.disabled) return
  clearTimeout(timer)
  visible.value = true
}

function close() {
  clearTimeout(timer)
  visible.value = false
}

// 悬浮触发要留出移动时间：鼠标从触发元素挪到浮层上会经过一段空隙，
// 立即关闭会让浮层根本点不到
function delayedClose() {
  if (props.trigger !== 'hover') return
  clearTimeout(timer)
  timer = setTimeout(close, 120)
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as Node
  if (triggerEl.value?.contains(target) || popupEl.value?.contains(target)) return
  close()
}

watch(visible, (open) => {
  if (open) {
    place()
    // 滚动与缩放都会让已算好的位置失效；passive 避免拖累滚动性能
    window.addEventListener('scroll', place, { passive: true, capture: true })
    window.addEventListener('resize', place)
    if (props.trigger === 'click') document.addEventListener('click', onDocumentClick)
  } else {
    window.removeEventListener('scroll', place, true)
    window.removeEventListener('resize', place)
    document.removeEventListener('click', onDocumentClick)
  }
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener('scroll', place, true)
  window.removeEventListener('resize', place)
  document.removeEventListener('click', onDocumentClick)
})

const style = computed(() => ({ left: `${pos.value.x}px`, top: `${pos.value.y}px` }))
const arrowStyle = computed(() =>
  pos.value.placement === 'top' || pos.value.placement === 'bottom'
    ? { left: `${pos.value.arrow - 4}px` }
    : { top: `${pos.value.arrow - 4}px` }
)
</script>

<template>
  <span
    ref="triggerEl"
    class="i-overlay-trigger"
    @click="trigger === 'click' && (visible ? close() : open())"
    @mouseenter="trigger === 'hover' && open()"
    @mouseleave="delayedClose"
    @keydown.escape="close"
  >
    <slot />
  </span>

  <IPortal>
    <Transition name="i-overlay-fade">
      <div
        v-if="visible"
        :id="id"
        ref="popupEl"
        class="i-popover"
        :class="`is-${pos.placement}`"
        :style="style"
        role="dialog"
        :aria-label="title || undefined"
        @mouseenter="trigger === 'hover' && open()"
        @mouseleave="delayedClose"
      >
        <span class="i-popover__arrow" :style="arrowStyle" />
        <p v-if="title" class="i-popover__title">{{ title }}</p>
        <div class="i-popover__body"><slot name="content">{{ content }}</slot></div>
      </div>
    </Transition>
  </IPortal>
</template>
