<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IVirtualList.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { scrollToRow, shouldVirtualize, virtualWindow } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    items: unknown[]
    /** 每行高度，像素。定高才能不量元素直接算窗口 */
    itemHeight?: number
    height?: number
    /** 上下各多渲染几行 */
    overscan?: number
  }>(),
  { itemHeight: 40, height: 320, overscan: 3 }
)

const scroller = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
let frame = 0

function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    scrollTop.value = scroller.value?.scrollTop ?? 0
  })
}

onBeforeUnmount(() => { if (frame) cancelAnimationFrame(frame) })
onMounted(() => { scrollTop.value = scroller.value?.scrollTop ?? 0 })

/*
 * 条目太少时不虚拟化：那时虚拟化只是徒增复杂度与一次布局计算，
 * 而且会平白丢掉浏览器自带的查找（Ctrl+F 找不到没渲染的行）。
 */
const virtual = computed(() => shouldVirtualize(props.items.length))

const win = computed(() =>
  virtualWindow(scrollTop.value, props.height, props.itemHeight, props.items.length, props.overscan)
)

const visible = computed(() =>
  virtual.value
    ? props.items.slice(win.value.start, win.value.end + 1).map((item, i) => ({
        item,
        index: win.value.start + i
      }))
    : props.items.map((item, index) => ({ item, index }))
)

function scrollTo(index: number) {
  const el = scroller.value
  if (!el) return
  el.scrollTop = scrollToRow(index, props.itemHeight, el.scrollTop, props.height)
}

defineExpose({ scrollTo })
</script>

<template>
  <div
    ref="scroller"
    class="i-virtual"
    :style="{ height: `${height}px` }"
    role="list"
    :aria-rowcount="items.length"
    @scroll.passive="onScroll"
  >
    <!--
      上下用两块空白撑开，而不是给容器一个固定高度再绝对定位每一行：
      撑开的写法让滚动条长度天然正确，也不必为每一行算 top，
      少一处会算错的地方。
    -->
    <div v-if="virtual" :style="{ height: `${win.paddingTop}px` }" aria-hidden="true" />
    <div
      v-for="row in visible"
      :key="row.index"
      class="i-virtual__row"
      role="listitem"
      :style="{ height: `${itemHeight}px` }"
    >
      <slot :item="row.item" :index="row.index" />
    </div>
    <div v-if="virtual" :style="{ height: `${win.paddingBottom}px` }" aria-hidden="true" />
  </div>
</template>
