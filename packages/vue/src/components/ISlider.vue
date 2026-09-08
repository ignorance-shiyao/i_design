<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISlider.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { ratioOf, valueFromRatio } from '@i-design/common'

export interface SliderMark {
  value: number
  label?: string
}

const props = withDefaults(
  defineProps<{
    value?: number
    min?: number
    max?: number
    step?: number
    precision?: number
    disabled?: boolean
    marks?: SliderMark[]
  }>(),
  { value: 0, min: 0, max: 100, step: 1, precision: 0, disabled: false, marks: () => [] }
)

const emit = defineEmits<{ (e: 'input', a0: number): void; (e: 'change', a0: number): void }>()

const track = ref<HTMLElement | null>(null)
const dragging = ref(false)

const ratio = computed(() => ratioOf(props.value, props.min, props.max))
const percent = computed(() => `${ratio.value * 100}%`)

/** 指针位置 → 取值：比例换算与步长对齐都在公共层，与其他端同一套 */
function valueAt(clientX: number) {
  const rect = track.value?.getBoundingClientRect()
  if (!rect || rect.width === 0) return props.value
  return valueFromRatio(
    (clientX - rect.left) / rect.width,
    props.min,
    props.max,
    props.step,
    props.precision
  )
}

function apply(clientX: number) {
  const next = valueAt(clientX)
  if (next === props.value) return
  emit('input', next)
  emit('change', next)
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled) return
  dragging.value = true
  // 捕获指针：拖到轨道之外也继续跟随，否则快速拖动会中途断开
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  apply(event.clientX)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  apply(event.clientX)
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  const delta =
    event.key === 'ArrowRight' || event.key === 'ArrowUp'
      ? props.step
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? -props.step
        : 0
  if (!delta) return
  event.preventDefault()
  const next = valueFromRatio(
    ratioOf(props.value + delta, props.min, props.max),
    props.min,
    props.max,
    props.step,
    props.precision
  )
  emit('input', next)
  emit('change', next)
}
</script>

<template>
  <div
    class="i-slider"
    :class="{ 'is-disabled': disabled }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div ref="track" class="i-slider__track">
      <div class="i-slider__fill" :style="{ left: 0, width: percent }" />

      <template v-for="mark in marks" :key="mark.value">
        <span
          class="i-slider__mark"
          :class="{ 'is-passed': mark.value <= value }"
          :style="{ left: `${ratioOf(mark.value, min, max) * 100}%` }"
        />
        <span
          v-if="mark.label"
          class="i-slider__label"
          :style="{ left: `${ratioOf(mark.value, min, max) * 100}%` }"
        >{{ mark.label }}</span>
      </template>

      <div
        class="i-slider__handle"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="value"
        :aria-disabled="disabled"
        :style="{ left: percent }"
        @keydown="onKeydown"
      />
    </div>
  </div>
</template>
