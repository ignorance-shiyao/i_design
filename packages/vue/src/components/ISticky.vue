<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISticky.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 吸顶。
 *
 * 与 Affix 的区别不只是参照物，实现路子也不同。
 *
 * Affix 参照视口，吸住时要脱离文档流，所以必须自己撑一块占位。
 * Sticky 参照所在的滚动容器，而浏览器原生的 position: sticky 正好就是这件事——
 * 它自己占位、自己在容器边界内停住，没有一帧的延迟，也不会在快速滚动时抖。
 * 自己用 fixed 加占位去模拟，只会做出一个更差的版本。
 *
 * 第一版正是这么写的：既给了占位又用了 sticky，两套机制打架，
 * 分组头被顶到容器外面去了。
 *
 * 共享判定仍然有用，但用途只剩一个：算出「此刻是不是吸住了」，
 * 好让调用方能给吸住态换个样式或收到事件——这件事 CSS 至今给不出答案。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { rafThrottle, resolveAffix, type AffixState } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 距容器顶部多少像素时吸住 */
    top?: number
    /** 滚动容器选择器。不传则用最近的可滚动祖先 */
    container?: string
  }>(),
  { top: 0, container: '' }
)

const emit = defineEmits<{ (e: 'change', a0: boolean): void }>()

const inner = ref<HTMLElement | null>(null)
/*
 * 哨兵：一个零高、不吸附的元素，紧挨在吸顶元素前面。
 *
 * 不能去量吸顶元素自己——它吸住之后就永远停在阈值那条线上，
 * 量出来的位置和「刚好要吸住」时一模一样，判定于是恒为「没吸住」。
 * 哨兵不吸附，会老老实实跟着内容滚走，它越过阈值那一刻就是吸住那一刻。
 */
const sentinel = ref<HTMLElement | null>(null)
const state = ref<AffixState>({ mode: 'none', offset: 0 })
let scroller: HTMLElement | null = null

/** 找最近的可滚动祖先：容器没写死时，组件应当自己认出该跟谁走 */
function findScroller(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node) {
    const overflow = getComputedStyle(node).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return node
    node = node.parentElement
  }
  return null
}

function measure() {
  const holder = inner.value
  const flag = sentinel.value
  if (!holder || !flag || !scroller) return

  const flagRect = flag.getBoundingClientRect()
  const boxRect = scroller.getBoundingClientRect()
  const next = resolveAffix(
    {
      // 相对容器算，而不是相对文档：容器自己也可能被页面滚走
      offsetTop: flagRect.top - boxRect.top + scroller.scrollTop,
      height: holder.offsetHeight,
      scrollTop: scroller.scrollTop,
      viewportHeight: scroller.clientHeight
    },
    { top: props.top }
  )

  if (next.mode !== state.value.mode) emit('change', next.mode !== 'none')
  state.value = next
}

/* 合并到每帧一次：measure 要量 sentinel 与容器的位置，合并逻辑走公共层 */
const onScroll = rafThrottle(measure)

onMounted(() => {
  scroller = props.container
    ? document.querySelector<HTMLElement>(props.container)
    : findScroller(sentinel.value)
  scroller?.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  measure()
})

onBeforeUnmount(() => {
  scroller?.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  onScroll.cancel()
})

/* 吸附交给原生 sticky，一直挂着；判定只负责标记状态 */
const style = computed(() => ({ top: `${props.top}px` }))
</script>

<template>
  <div class="i-sticky">
    <span ref="sentinel" class="i-sticky__sentinel" aria-hidden="true" />
    <div
      ref="inner"
      class="i-sticky__inner"
      :class="{ 'is-stuck': state.mode !== 'none' }"
      :style="style"
    >
      <slot />
    </div>
  </div>
</template>
