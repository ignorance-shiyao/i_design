<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'
import { clampNumber, roundTo, stepValue } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    min?: number
    max?: number
    step?: number
    /** 小数位；步进与失焦时都按它取整 */
    precision?: number
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    invalid?: boolean
    placeholder?: string
    /** 隐藏两侧的加减按钮，只保留键盘输入 */
    hideStep?: boolean
  }>(),
  {
    modelValue: null,
    min: Number.NEGATIVE_INFINITY,
    max: Number.POSITIVE_INFINITY,
    step: 1,
    precision: 0,
    size: 'md',
    disabled: false,
    invalid: false,
    placeholder: '',
    hideStep: false
  }
)

const emit = defineEmits<{ 'update:modelValue': [number | null]; change: [number | null] }>()

const focused = ref(false)
/** 输入过程中的原始文本：中途可能是 "-" 或 "1." 这类还不能解析的中间态 */
const draft = ref<string | null>(null)

const display = computed(() =>
  draft.value !== null ? draft.value : props.modelValue === null ? '' : String(props.modelValue)
)

const canMinus = computed(
  () => !props.disabled && (props.modelValue === null || props.modelValue > props.min)
)
const canPlus = computed(
  () => !props.disabled && (props.modelValue === null || props.modelValue < props.max)
)

/** 夹取与取整走公共层，七端同一套规则 */
function normalize(value: number) {
  return roundTo(clampNumber(value, props.min, props.max), props.precision)
}

function commit(value: number | null) {
  emit('update:modelValue', value)
  emit('change', value)
}

function stepBy(delta: number) {
  if (props.disabled) return
  const base = props.modelValue ?? 0
  commit(stepValue(base, delta * props.step, props.min, props.max, props.precision))
}

function onInput(event: Event) {
  const text = (event.target as HTMLInputElement).value
  draft.value = text
  if (text === '' ) {
    commit(null)
    return
  }
  const parsed = Number(text)
  // 中间态（"-"、"1."）不回写，等失焦时再规整，否则用户打不出负数
  if (Number.isFinite(parsed)) commit(parsed)
}

function onBlur() {
  focused.value = false
  draft.value = null
  if (props.modelValue !== null) commit(normalize(props.modelValue))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    stepBy(1)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    stepBy(-1)
  }
}
</script>

<template>
  <div
    class="i-input-number"
    :class="[
      `i-input-number--${size}`,
      { 'is-focused': focused, 'is-disabled': disabled, 'is-invalid': invalid }
    ]"
  >
    <button
      v-if="!hideStep"
      class="i-input-number__step i-input-number__step--minus"
      type="button"
      aria-label="减少"
      :disabled="!canMinus"
      @click="stepBy(-1)"
    >
      <IIcon name="minus" :size="14" />
    </button>

    <input
      class="i-input-number__field"
      type="number"
      inputmode="decimal"
      :value="display"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min === Number.NEGATIVE_INFINITY ? undefined : min"
      :max="max === Number.POSITIVE_INFINITY ? undefined : max"
      :step="step"
      role="spinbutton"
      :aria-valuenow="modelValue ?? undefined"
      @input="onInput"
      @keydown="onKeydown"
      @focus="focused = true"
      @blur="onBlur"
    />

    <button
      v-if="!hideStep"
      class="i-input-number__step i-input-number__step--plus"
      type="button"
      aria-label="增加"
      :disabled="!canPlus"
      @click="stepBy(1)"
    >
      <IIcon name="plus" :size="14" />
    </button>
  </div>
</template>
