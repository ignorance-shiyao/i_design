<script setup lang="ts">
import { computed } from 'vue'
import IIcon from './_Icon.vue'
import { clampNumber, stepValue } from '@i-design/common'

/**
 * 步进器。
 *
 * 与 Web 的 InputNumber 是两件东西，不是同一件的大号版：桌面端以键盘输入为主、
 * 加减键是补充；手机上反过来——拇指点加减是主路径，弹键盘要占掉半屏。
 * 取值与边界仍走 logic/number，与 Web 端同一份实现。
 */
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    /** 小数位，步进与失焦时按它取整 */
    precision?: number
    size?: 'sm' | 'md'
    disabled?: boolean
    /** 只读：仍可点加减，但不弹键盘。数量类场景常用 */
    inputDisabled?: boolean
  }>(),
  {
    min: 0,
    max: Number.POSITIVE_INFINITY,
    step: 1,
    precision: 0,
    size: 'md',
    disabled: false,
    inputDisabled: false
  }
)

const emit = defineEmits<{ 'update:modelValue': [number]; change: [number] }>()

const canMinus = computed(() => !props.disabled && props.modelValue > props.min)
const canPlus = computed(() => !props.disabled && props.modelValue < props.max)

function commit(next: number) {
  const value = clampNumber(next, props.min, props.max)
  if (value === props.modelValue) return
  emit('update:modelValue', value)
  emit('change', value)
}

function bump(direction: 1 | -1) {
  commit(
    stepValue(props.modelValue, props.step * direction, props.min, props.max, props.precision)
  )
}

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const parsed = Number(raw)
  // 中途可能是 "" 或 "-"，这时不提交：提交会把用户正在敲的值抹掉
  if (raw === '' || Number.isNaN(parsed)) return
  commit(parsed)
}
</script>

<template>
  <div class="i-stepper" :class="`i-stepper--${size}`">
    <button
      class="i-stepper__btn"
      type="button"
      aria-label="减少"
      :disabled="!canMinus"
      @click="bump(-1)"
    >
      <IIcon name="minus" :size="18" />
    </button>

    <input
      class="i-stepper__input"
      :value="modelValue"
      :disabled="disabled || inputDisabled"
      inputmode="decimal"
      aria-label="数量"
      @input="onInput"
    />

    <button
      class="i-stepper__btn"
      type="button"
      aria-label="增加"
      :disabled="!canPlus"
      @click="bump(1)"
    >
      <IIcon name="plus" :size="18" />
    </button>
  </div>
</template>
