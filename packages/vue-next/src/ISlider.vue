<script setup lang="ts">
import { computed, ref } from 'vue'
import { ratioOf, valueFromRatio } from '@i-design/common'

export interface SliderMark {
  value: number
  label?: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: number
    min?: number
    max?: number
    step?: number
    precision?: number
    disabled?: boolean
    marks?: SliderMark[]
    /**
     * 无障碍名。
     *
     * 滑块只播报数值，不播报这是什么值：读屏用户听到的是「滑块，40」，
     * 40 是音量还是亮度，只有看得见的人知道。
     */
    ariaLabel?: string
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    precision: 0,
    disabled: false,
    marks: () => [],
    ariaLabel: ''
  }
)

const emit = defineEmits<{ 'update:modelValue': [number]; change: [number] }>()

const track = ref<HTMLElement | null>(null)
const dragging = ref(false)

const ratio = computed(() => ratioOf(props.modelValue, props.min, props.max))
const percent = computed(() => `${ratio.value * 100}%`)

/** 指针位置 → 取值：比例换算与步长对齐都在公共层，与其他端同一套 */
function valueAt(clientX: number) {
  const rect = track.value?.getBoundingClientRect()
  if (!rect || rect.width === 0) return props.modelValue
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
  if (next === props.modelValue) return
  emit('update:modelValue', next)
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
    ratioOf(props.modelValue + delta, props.min, props.max),
    props.min,
    props.max,
    props.step,
    props.precision
  )
  emit('update:modelValue', next)
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
          :class="{ 'is-passed': mark.value <= modelValue }"
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
        :aria-label="ariaLabel || undefined"
        :tabindex="disabled ? -1 : 0"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="modelValue"
        :aria-disabled="disabled"
        :style="{ left: percent }"
        @keydown="onKeydown"
      />
    </div>
  </div>
</template>
