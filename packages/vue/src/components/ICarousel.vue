<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ICarousel.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import {
  dotRange,
  nextIndex,
  resolveSwipe,
  rubberBand,
  shouldAutoplay,
  trackOffset
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 每一张的说明，同时用作读屏文案与缩略提示 */
    items: { key: string; label?: string }[]
    value?: number
    /** 自动播放间隔（毫秒）；0 表示不自动播放 */
    interval?: number
    loop?: boolean
    height?: number
    /** 指示点最多显示几个，超出就只显示当前页附近的一段 */
    maxDots?: number
    /** 显示左右箭头。触摸端通常关掉，手势本身就够了 */
    arrows?: boolean
  }>(),
  { value: 0, interval: 0, loop: true, height: 220, maxDots: 7, arrows: true }
)

const emit = defineEmits<{ (e: 'input', a0: number): void }>()

const index = ref(props.value)
watch(() => props.value, (v) => (index.value = v))
watch(index, (v) => emit('input', v))

const root = ref<HTMLElement | null>(null)
const width = ref(0)
const drag = ref<{ startX: number; dx: number; at: number } | null>(null)
const hovered = ref(false)
const focused = ref(false)
const documentHidden = ref(false)
const reducedMotion = ref(false)

const count = computed(() => props.items.length)
const dots = computed(() => dotRange(index.value, count.value, props.maxDots))

/*
 * 轨道位移。拖动时把手指位移折算成小数张，每一帧都跟手；
 * 松手后落到整数张，由 CSS 过渡收尾。
 */
const offset = computed(() =>
  rubberBand(trackOffset(index.value, drag.value?.dx ?? 0, width.value), count.value, props.loop)
)

function go(delta: number) {
  index.value = nextIndex(index.value, count.value, delta, props.loop)
}

function jump(target: number) {
  index.value = Math.min(count.value - 1, Math.max(0, target))
}

function onPointerDown(event: PointerEvent) {
  if (count.value <= 1) return
  drag.value = { startX: event.clientX, dx: 0, at: Date.now() }
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!drag.value) return
  drag.value = { ...drag.value, dx: event.clientX - drag.value.startX }
}

function onPointerUp() {
  if (!drag.value) return
  // 位移与速度任一达标就翻页：只看位移会把手机上最自然的短促轻扫判成「没划够」
  const direction = resolveSwipe(drag.value.dx, width.value, Date.now() - drag.value.at)
  drag.value = null
  if (direction) go(direction)
}

/*
 * 自动播放。用一次性的 timeout 链而不是 setInterval：
 * interval 型定时器在页面卡顿后会把攒下的几次一起补发，画面会连翻好几张。
 */
let timer: ReturnType<typeof setTimeout> | null = null

function stop() {
  if (timer) clearTimeout(timer)
  timer = null
}

function schedule() {
  stop()
  if (!props.interval) return
  const playing = shouldAutoplay({
    enabled: props.interval > 0,
    count: count.value,
    hovered: hovered.value,
    focused: focused.value,
    dragging: !!drag.value,
    documentHidden: documentHidden.value,
    reducedMotion: reducedMotion.value
  })
  if (!playing) return
  timer = setTimeout(() => {
    go(1)
    schedule()
  }, props.interval)
}

watch([hovered, focused, drag, documentHidden, reducedMotion, index, () => props.interval], schedule)

function measure() {
  width.value = root.value?.getBoundingClientRect().width ?? 0
}

let observer: ResizeObserver | null = null
const onVisibility = () => (documentHidden.value = document.hidden)

onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (root.value) observer.observe(root.value)
  documentHidden.value = document.hidden
  document.addEventListener('visibilitychange', onVisibility)
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = query.matches
  query.addEventListener('change', (e) => (reducedMotion.value = e.matches))
  schedule()
})

onBeforeUnmount(() => {
  stop()
  observer?.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    go(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    go(1)
  }
}

const atStart = computed(() => !props.loop && index.value === 0)
const atEnd = computed(() => !props.loop && index.value === count.value - 1)
</script>

<template>
  <!--
    roledescription 而不是 role="region"：读屏会念出「轮播」，
    使用者才知道左右方向键在这里是有意义的。
  -->
  <section
    ref="root"
    class="i-carousel"
    role="group"
    aria-roledescription="轮播"
    :style="{ height: `${height}px` }"
    tabindex="0"
    @keydown="onKeydown"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <div
      class="i-carousel__track"
      :class="{ 'is-dragging': !!drag }"
      :style="{ transform: `translate3d(${-offset * 100}%, 0, 0)` }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div
        v-for="(item, i) in items"
        :key="item.key"
        class="i-carousel__slide"
        role="group"
        aria-roledescription="幻灯片"
        :aria-label="item.label || `第 ${i + 1} 张`"
        :aria-hidden="i !== index"
      >
        <slot :name="item.key" :item="item" :index="i">
          <div class="i-carousel__placeholder">{{ item.label }}</div>
        </slot>
      </div>
    </div>

    <template v-if="arrows && count > 1">
      <button
        class="i-carousel__arrow i-carousel__arrow--prev"
        aria-label="上一张"
        :disabled="atStart"
        @click="go(-1)"
      >
        <IIcon name="chevron-left" :size="16" />
      </button>
      <button
        class="i-carousel__arrow i-carousel__arrow--next"
        aria-label="下一张"
        :disabled="atEnd"
        @click="go(1)"
      >
        <IIcon name="chevron-right" :size="16" />
      </button>
    </template>

    <!--
      指示点是按钮而不是装饰：它们可点、可聚焦，读屏也要能念出「第 3 张，共 12 张」。
      纯 div 加个 click 的做法用键盘完全够不着。
    -->
    <div v-if="count > 1" class="i-carousel__dots">
      <button
        v-for="dot in dots.items"
        :key="dot"
        class="i-carousel__dot"
        :class="{ 'is-active': dot === dots.active }"
        :aria-label="`第 ${dot + 1} 张，共 ${count} 张`"
        :aria-current="dot === dots.active"
        @click="jump(dot)"
      />
    </div>
  </section>
</template>
