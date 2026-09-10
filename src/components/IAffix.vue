<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { resolveAffix, type AffixState } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 距视口顶部多少像素时吸住 */
    top?: number
    /** 距视口底部多少像素时吸住。与 top 二选一 */
    bottom?: number
    /** 容器选择器：容器滚出视口时元素跟着一起走 */
    container?: string
  }>(),
  { top: 0, bottom: undefined, container: '' }
)

const emit = defineEmits<{ change: [boolean] }>()

const root = ref<HTMLElement | null>(null)
const state = ref<AffixState>({ mode: 'none', offset: 0 })
/** 占位高度：吸住时元素脱离文档流，不占位的话下面的内容会往上跳一整块 */
const placeholder = ref(0)
let frame = 0

function measure() {
  frame = 0
  const el = root.value
  if (!el) return
  const holder = el.firstElementChild as HTMLElement | null
  if (!holder) return

  const rect = el.getBoundingClientRect()
  const height = holder.offsetHeight
  const container = props.container ? document.querySelector(props.container) : null
  const containerRect = container?.getBoundingClientRect()

  const next = resolveAffix(
    {
      offsetTop: rect.top + window.scrollY,
      height,
      scrollTop: window.scrollY,
      viewportHeight: window.innerHeight,
      containerBottom: containerRect ? containerRect.bottom + window.scrollY : undefined
    },
    { top: props.bottom === undefined ? props.top : undefined, bottom: props.bottom }
  )

  if (next.mode !== state.value.mode) emit('change', next.mode !== 'none')
  state.value = next
  placeholder.value = next.mode === 'none' ? 0 : height
}

/* 滚动事件合并到 rAF：每帧最多量一次布局，不然长页面上滚动会明显发涩 */
function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(measure)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  measure()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (frame) cancelAnimationFrame(frame)
})

const style = computed(() => {
  if (state.value.mode === 'none') return undefined
  return state.value.mode === 'top'
    ? { position: 'fixed' as const, top: `${state.value.offset}px`, zIndex: 'var(--i-z-sticky)' }
    : { position: 'fixed' as const, bottom: `${state.value.offset}px`, zIndex: 'var(--i-z-sticky)' }
})

defineExpose({ measure })
</script>

<template>
  <!--
    外层始终留在文档流里并撑出占位高度。
    吸住时内层脱离文档流，不占位的话下面的内容会整块往上跳一次——
    那一跳正好发生在用户滚动时，看起来像页面抖了一下。
  -->
  <div ref="root" class="i-affix" :style="{ height: placeholder ? `${placeholder}px` : undefined }">
    <div class="i-affix__inner" :class="{ 'is-affixed': state.mode !== 'none' }" :style="style">
      <slot />
    </div>
  </div>
</template>
