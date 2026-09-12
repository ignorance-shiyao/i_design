<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { rafThrottle, scrollToRow, shouldVirtualize, virtualWindow } from '@i-design/common'

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
/* 每帧最多读一次滚动位置，合并逻辑走公共层 */
const onScroll = rafThrottle(() => {
  scrollTop.value = scroller.value?.scrollTop ?? 0
})

onBeforeUnmount(() => onScroll.cancel())
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
    tabindex="0"
    @scroll.passive="onScroll"
  >
    <!--
      总数与序号挂在每一项上（aria-setsize / aria-posinset），不挂在容器上：
      容器上的 aria-rowcount 只对表格类角色有效，写在 role="list" 上是无效属性。
      虚拟滚动尤其需要这两个——不给的话读屏会按「当前渲染了几项」播报，
      两万行的列表被念成「第 3 项，共 12 项」。
    -->
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
      :aria-setsize="items.length"
      :aria-posinset="row.index + 1"
      :style="{ height: `${itemHeight}px` }"
    >
      <slot :item="row.item" :index="row.index" />
    </div>
    <div v-if="virtual" :style="{ height: `${win.paddingBottom}px` }" aria-hidden="true" />
  </div>
</template>
