<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ICell from './ICell.vue'
import { activeIndexAt, groupByIndex, rafThrottle } from '@i-design/common'

/**
 * 索引列表：通讯录那种「右侧 A–Z、点哪跳哪」的列表。
 *
 * 分组与定位的规则在 logic/indexes：中文转拼音由调用方给 key，
 * 组件不替它决定用哪套词库（「重庆」归 C 还是 Z 取决于那套表）。
 */
const props = defineProps<{
  items: { key: string; label: string; description?: string }[]
}>()

const emit = defineEmits<{ select: [{ key: string; label: string }] }>()

const groups = computed(() => groupByIndex(props.items, (item) => item.key))
const active = ref('')
const hint = ref('')
const root = ref<HTMLElement>()

/*
 * 分组的位置只在内容或尺寸变化时量一次，不在滚动里量。
 *
 * 每个滚动事件都 querySelectorAll 再读 offsetTop，等于每帧强制同步布局几十次——
 * 一次滑动能打出上百个 scroll 事件，手指划得动、列表跟不上。
 * 位置本身在滚动期间不会变，量一次就够。
 */
let offsets: { index: string; top: number }[] = []

function measure() {
  const el = root.value
  if (!el) return
  offsets = [...el.querySelectorAll<HTMLElement>('[data-index]')].map((node) => ({
    index: node.dataset.index!,
    top: node.offsetTop
  }))
}

/* 只读 scrollTop（不触发布局）并比对已量好的位置，因此可以每帧跑 */
const onScroll = rafThrottle(() => {
  const el = root.value
  if (!el) return
  if (!offsets.length) measure()
  active.value = activeIndexAt(offsets, el.scrollTop)
})

/* 列表变了要重量：条目增减会让每一组的位置整体平移 */
watch(
  () => props.items,
  () => requestAnimationFrame(measure),
  { immediate: true }
)

let observer: ResizeObserver | null = null
onBeforeUnmount(() => {
  onScroll.cancel()
  observer?.disconnect()
})

function jump(index: string) {
  const target = root.value?.querySelector<HTMLElement>(`[data-index="${index}"]`)
  if (!target || !root.value) return
  root.value.scrollTop = target.offsetTop
  active.value = index
}

/* 容器尺寸变化（旋屏、键盘弹出）同样要重量 */
function onMounted$(el: HTMLElement | null) {
  if (!el || observer) return
  observer = new ResizeObserver(() => measure())
  observer.observe(el)
  measure()
}

/* 手指压住索引条滑动：中途一直跟着跳，松手才收起提示 */
function onBarMove(event: TouchEvent) {
  const touch = event.touches[0]
  const node = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
  const letter = node?.dataset?.letter
  if (!letter || letter === hint.value) return
  hint.value = letter
  jump(letter)
}
</script>

<template>
  <div class="i-indexes">
    <div
      class="i-indexes__scroll"
      :ref="(el) => { root = el as HTMLElement; onMounted$(root) }"
      @scroll.passive="onScroll"
    >
      <template v-for="group in groups" :key="group.index">
        <p class="i-indexes__title" :data-index="group.index">{{ group.index }}</p>
        <!-- 行本身就是 ICell：手抄一遍它的类名，改动 ICell 时这里不会跟着变 -->
        <ICell
          v-for="item in group.items"
          :key="item.label"
          :title="item.label"
          :description="item.description"
          clickable
          @click="emit('select', item)"
        />
      </template>
    </div>

    <nav
      class="i-indexes__bar"
      aria-label="索引"
      @touchstart.prevent="onBarMove"
      @touchmove.prevent="onBarMove"
      @touchend="hint = ''"
      @touchcancel="hint = ''"
    >
      <span
        v-for="group in groups"
        :key="group.index"
        class="i-indexes__letter"
        :class="{ 'is-active': active === group.index }"
        :data-letter="group.index"
        @click="jump(group.index)"
        >{{ group.index }}</span
      >
    </nav>

    <!-- 手指压住索引条时，那个字母正好被手挡住，因此在屏幕中央再显示一次 -->
    <div v-if="hint" class="i-indexes__hint" aria-hidden="true">{{ hint }}</div>
  </div>
</template>
