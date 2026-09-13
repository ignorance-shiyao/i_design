<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IInsightCards.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 洞察卡：一句结论配一条趋势线，左右翻页看下一条。
 *
 * 两个决定值得写下来：
 *
 * **结论在上、图在下，而不是反过来。** 洞察卡的主角是那句话，图是它的依据。
 * 图放上面，读者会先去解读曲线，等读到结论时已经自己得出了一个——两者不一致
 * 时他信自己那个，这张卡就白做了。
 *
 * **趋势线可以擦洗。** 一句「周三回升」不给具体数字，读者无从判断这个回升
 * 是 2% 还是 20%。横向划过曲线，读数跟着走；键盘用左右键，Home / End 跳到两端。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import IIcon from './IIcon.vue'
import {
  areaPath,
  domainOf,
  INSIGHT_DOT_R,
  insightPage,
  insightPlot,
  insightTrend,
  linePath,
  scrubIndex,
  scrubReadout,
  scrubX,
  trendIcon,
  trendLabel,
  type InsightItem
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    items: InsightItem[]
    /** 当前是第几条（用 v-model:index 控制） */
    index?: number
  }>(),
  { index: 0 }
)

const emit = defineEmits<{ (e: 'update:index', value: number): void }>()

const PLOT_H = 84

/*
 * viewBox 的宽度取元素的实际宽度，而不是写死一个数再让 SVG 拉伸。
 * 拉伸的代价不只是难算：非等比缩放会把标记的圆画成椭圆，
 * 320 的框铺到 380px 宽时那个圆横向胖了近两成，看得出来。
 */
const svgEl = ref<SVGSVGElement>()
const plotW = ref(320)
let observer: ResizeObserver | undefined

onMounted(() => {
  if (!svgEl.value) return
  observer = new ResizeObserver(([entry]) => {
    plotW.value = Math.max(1, entry.contentRect.width)
  })
  observer.observe(svgEl.value)
})
onBeforeUnmount(() => observer?.disconnect())

/** 曲线往里缩一圈，首尾的标记圆才是整圆而不是被边裁掉一半 */
const plot = computed(() => insightPlot(plotW.value))

const current = computed(() => props.items[props.index])

/** 擦洗到第几个点。null 表示没在擦——此时读数显示最后一个点 */
const scrubbed = ref<number | null>(null)

const activeIndex = computed(() => {
  const count = current.value?.series.length ?? 0
  if (!count) return 0
  return scrubbed.value ?? count - 1
})

const scale = computed(() => {
  const data = current.value?.series ?? []
  // fromZero 关掉：洞察看的是这段时间的起伏，从 0 起会把一条明显的波动压成直线
  return domainOf([{ name: '', data }], { fromZero: false })
})

const line = computed(() =>
  linePath(current.value?.series ?? [], scale.value.min, scale.value.max, plot.value.inner, PLOT_H)
)
const area = computed(() =>
  areaPath(current.value?.series ?? [], scale.value.min, scale.value.max, plot.value.inner, PLOT_H)
)

const markerX = computed(() =>
  scrubX(activeIndex.value, plot.value.inner, current.value?.series.length ?? 0)
)
const markerY = computed(() => {
  const value = current.value?.series[activeIndex.value]
  if (value === undefined) return 0
  const { min, max } = scale.value
  const span = max - min || 1
  return PLOT_H - ((value - min) / span) * PLOT_H
})

const readout = computed(() =>
  current.value ? scrubReadout(current.value, activeIndex.value) : { label: '', value: '' }
)
const trend = computed(() => insightTrend(current.value?.series ?? []))

function go(delta: number) {
  scrubbed.value = null
  emit('update:index', insightPage(props.items.length, props.index, delta))
}

function onScrub(event: PointerEvent) {
  // buttons 为 0 表示只是掠过：指针端允许悬停擦洗，触摸端只有按住才会有 buttons
  if (event.pointerType !== 'mouse' && !event.buttons) return
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  const count = current.value?.series.length ?? 0
  // 减掉留边：曲线是缩进去画的，不减的话手指在左边缘时算出来的是负数
  scrubbed.value = scrubIndex(event.clientX - box.left - plot.value.inset, plot.value.inner, count)
}

function onScrubKey(event: KeyboardEvent) {
  const count = current.value?.series.length ?? 0
  if (!count) return
  const at = activeIndex.value
  if (event.key === 'ArrowLeft') scrubbed.value = Math.max(0, at - 1)
  else if (event.key === 'ArrowRight') scrubbed.value = Math.min(count - 1, at + 1)
  else if (event.key === 'Home') scrubbed.value = 0
  else if (event.key === 'End') scrubbed.value = count - 1
  else return
  event.preventDefault()
}
</script>

<template>
  <section v-if="current" class="i-insight">
    <header class="i-insight__head">
      <h3 class="i-insight__title">{{ current.title }}</h3>
      <!--
        涨跌同时给出图标与文字：只给箭头和红绿，色觉障碍用户与灰度打印都读不出来，
        而且也说不清涨了多少。
      -->
      <span class="i-insight__trend" :class="`i-insight__trend--${trend.direction}`">
        <IIcon :name="trendIcon(trend)" :size="13" />
        {{ trendLabel(trend) }}
      </span>
    </header>

    <p class="i-insight__summary">{{ current.summary }}</p>

    <div class="i-insight__plot">
      <svg
        ref="svgEl"
        class="i-insight__svg"
        :viewBox="`0 0 ${plotW} ${PLOT_H}`"
        role="img"
        tabindex="0"
        :aria-label="`${current.title} 趋势，${trendLabel(trend)}，当前读数 ${readout.label} ${readout.value}`"
        @pointermove="onScrub"
        @pointerdown="onScrub"
        @pointerleave="scrubbed = null"
        @keydown="onScrubKey"
      >
        <g :transform="`translate(${plot.inset} 0)`">
          <path class="i-insight__area" :d="area" />
          <path class="i-insight__line" :d="line" />
          <line class="i-insight__cursor" :x1="markerX" :x2="markerX" y1="0" :y2="PLOT_H" />
          <circle class="i-insight__dot" :cx="markerX" :cy="markerY" :r="INSIGHT_DOT_R" />
        </g>
      </svg>
      <!-- 读数用文字写在图外面，而不是画进 SVG：画进去的字不会跟着页面字号走 -->
      <p class="i-insight__readout" aria-live="polite">
        <span class="i-insight__readout-label">{{ readout.label }}</span>
        <span class="i-insight__readout-value">{{ readout.value }}</span>
      </p>
    </div>

    <footer class="i-insight__foot">
      <button
        class="i-insight__nav"
        type="button"
        aria-label="上一条洞察"
        :disabled="index <= 0"
        @click="go(-1)"
      >
        <IIcon name="chevron-left" :size="15" />
      </button>
      <!-- 位置用文字而不是一排点：点只说得清「有几条」，说不清「现在是第几条」 -->
      <span class="i-insight__pager">{{ index + 1 }} / {{ items.length }}</span>
      <button
        class="i-insight__nav"
        type="button"
        aria-label="下一条洞察"
        :disabled="index >= items.length - 1"
        @click="go(1)"
      >
        <IIcon name="chevron-right" :size="15" />
      </button>
    </footer>
  </section>
</template>
