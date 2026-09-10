<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { activeIndex, groupByIndex, indexAt } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    items: Record<string, unknown>[]
    /** 从条目里取出用于分组的字段（通常是拼音首字母） */
    indexKey?: string
    labelKey?: string
    height?: number
  }>(),
  { indexKey: 'index', labelKey: 'label', height: 360 }
)

const scroller = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const active = ref(0)
/** 手指按在字母条上时才显示的大字提示 */
const hint = ref<string | null>(null)

const groups = computed(() =>
  groupByIndex(props.items, (item) => String(item[props.indexKey] ?? ''))
)

let offsets: number[] = []

function measure() {
  const el = scroller.value
  if (!el) return
  offsets = groups.value.map((group) => {
    const node = el.querySelector<HTMLElement>(`[data-index="${group.key}"]`)
    return node ? node.offsetTop : 0
  })
}

onMounted(measure)

function onScroll() {
  if (!offsets.length) measure()
  active.value = activeIndex(offsets, scroller.value?.scrollTop ?? 0)
}

function jump(index: number) {
  const el = scroller.value
  if (!el || index < 0 || index >= groups.value.length) return
  active.value = index
  hint.value = groups.value[index].key
  el.scrollTop = offsets[index] ?? 0
}

/*
 * 用「落在哪一格」而不是「离哪个字母最近」：
 * 最近判定在两格交界处会来回跳，手指几乎没动、列表却在两个分组之间反复横跳。
 */
function onBarTouch(event: TouchEvent) {
  const rect = bar.value?.getBoundingClientRect()
  if (!rect) return
  event.preventDefault()
  jump(indexAt(event.touches[0].clientY - rect.top, rect.height, groups.value.length))
}

const clearHint = () => { hint.value = null }
</script>

<template>
  <div class="i-indexbar" :style="{ height: `${height}px` }">
    <div ref="scroller" class="i-indexbar__scroll" @scroll.passive="onScroll">
      <template v-for="group in groups" :key="group.key">
        <div class="i-indexbar__title" :data-index="group.key">{{ group.key }}</div>
        <div v-for="(item, i) in group.items" :key="i" class="i-indexbar__item">
          {{ item[labelKey] }}
        </div>
      </template>
    </div>

    <!--
      字母条是 aria-hidden 的：它是给手指用的快捷入口，读屏使用者靠分组标题
      本身就能导航，把 26 个单字母再念一遍只会把列表淹掉。
    -->
    <div
      ref="bar"
      class="i-indexbar__bar"
      aria-hidden="true"
      @touchstart.prevent="onBarTouch"
      @touchmove.prevent="onBarTouch"
      @touchend="clearHint"
      @touchcancel="clearHint"
    >
      <span
        v-for="(group, i) in groups"
        :key="group.key"
        class="i-indexbar__letter"
        :class="{ 'is-active': i === active }"
        @click="jump(i)"
      >
        {{ group.key }}
      </span>
    </div>

    <!-- 手指按住时的大字提示：字母条本身太窄，手指正好盖住自己点的那个字母 -->
    <div v-if="hint" class="i-indexbar__hint">{{ hint }}</div>
  </div>
</template>
