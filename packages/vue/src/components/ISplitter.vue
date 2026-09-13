<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISplitter.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  isSplitterResetKey,
  keyboardStep,
  paneRatio,
  paneSize,
  resetPaneSize,
  resizePane
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 第一栏占比 0-1，支持 v-model */
    value?: number
    direction?: 'horizontal' | 'vertical'
    /** 两栏各自的最小尺寸，像素 */
    minFirst?: number
    minSecond?: number
    maxFirst?: number
    gutter?: number
    /** 双击分隔条复位到这个比例 */
    resetTo?: number
  }>(),
  {
    value: 0.5,
    direction: 'horizontal',
    minFirst: 120,
    minSecond: 120,
    maxFirst: 0,
    gutter: 4,
    resetTo: 0.5
  }
)

const emit = defineEmits<{ (e: 'input', a0: number): void }>()

const root = ref<HTMLElement | null>(null)
const dragging = ref(false)
const total = ref(0)

const isRow = computed(() => props.direction === 'horizontal')

function measure() {
  const el = root.value
  if (!el) return
  total.value = isRow.value ? el.clientWidth : el.clientHeight
}

function apply(nextSize: number) {
  const clamped = resizePane(
    total.value,
    nextSize,
    { min: props.minFirst, max: props.maxFirst || undefined },
    { min: props.minSecond },
    props.gutter
  )
  emit('input', paneRatio(clamped, total.value, props.gutter))
}

function onDown(event: PointerEvent) {
  measure()
  dragging.value = true
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
}

function onMove(event: PointerEvent) {
  if (!dragging.value) return
  const rect = root.value?.getBoundingClientRect()
  if (!rect) return
  apply(isRow.value ? event.clientX - rect.left : event.clientY - rect.top)
}

const onUp = () => { dragging.value = false }

/*
 * 双击分隔条复位。
 *
 * 拖歪之后想回到原样，不复位的话只能凭眼睛拖回去——而「正好一半」是拖不准的。
 * 复位同样要过一遍夹取：容器变窄之后，五五开算出来的第一栏可能比 minFirst 还小，
 * 直接写回比例会得到一个拖都拖不出来的状态。
 */
function reset() {
  measure()
  const size = resetPaneSize(
    props.resetTo,
    total.value,
    { min: props.minFirst, max: props.maxFirst || undefined },
    { min: props.minSecond },
    props.gutter
  )
  emit('input', paneRatio(size, total.value, props.gutter))
}

/*
 * 分隔条必须能用键盘拖：它是个真正的控件，不是装饰。
 * 只能鼠标拖的话，用键盘操作的人永远改不了这个布局。
 */
function onKeydown(event: KeyboardEvent) {
  // 双击对键盘使用者不存在，Enter / 空格是同一个动作的键盘等价物
  if (isSplitterResetKey(event.key)) {
    event.preventDefault()
    reset()
    return
  }
  const step = keyboardStep(event.key, event.shiftKey)
  if (!step) return
  event.preventDefault()
  measure()
  apply(paneSize(props.value, total.value, props.gutter) + step)
}

let observer: ResizeObserver | null = null
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (root.value) observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

/*
 * 第一栏写死 flex: 0 0 <基准>，不能只给 flex-basis。
 *
 * .i-splitter__pane 上有 flex: 1 1 0，两栏都会去分剩余空间——
 * 于是无论基准算得多准，最终宽度都被平分回去，比例计算等于没生效。
 * 基准按「容器减掉分隔条」算，不是按容器算：差的正好是分隔条那几像素，
 * 拖到底时那几像素会让另一栏突破下限。
 */
const firstStyle = computed(() => ({
  flex: `0 0 calc((100% - ${props.gutter}px) * ${props.value})`
}))

/** 拖动时的百分比读数，给读屏用 */
const percent = computed(() => Math.round(props.value * 100))
</script>

<template>
  <div
    ref="root"
    class="i-splitter"
    :class="[`i-splitter--${direction}`, { 'is-dragging': dragging }]"
  >
    <div class="i-splitter__pane" :style="firstStyle"><slot name="first" /></div>

    <!--
      role="separator" 加 aria-valuenow 不是形式：读屏使用者靠它知道
      「现在是三七开」以及自己按方向键改到了多少。
      没有这两样，键盘能拖但拖完不知道拖到了哪里。
    -->
    <div
      class="i-splitter__gutter"
      role="separator"
      tabindex="0"
      :aria-orientation="isRow ? 'vertical' : 'horizontal'"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`调整分栏比例，当前 ${percent}%；双击或按 Enter 复位`"
      :style="{ flexBasis: `${gutter}px` }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @dblclick="reset"
      @keydown="onKeydown"
    >
      <span class="i-splitter__grip" />
    </div>

    <div class="i-splitter__pane"><slot name="second" /></div>
  </div>
</template>
