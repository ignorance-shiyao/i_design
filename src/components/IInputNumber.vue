<script setup lang="ts">
/*
 * 落在这个组件上的属性要转给里面的 <input>，而不是外面那层包装 div。
 * 不这么做的话，`<IFormItem>` 给出的 `id` 会挂在 div 上，
 * 而 `<label for>` 指向的是一个不可标注的元素——标签白写了。
 * class 与 style 例外，它们仍然作用在外层。
 */
defineOptions({ inheritAttrs: false })
import { useConfig } from './useConfig'
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
    /**
     * 无障碍名。
     *
     * 控件旁边没有可见文字时必须给：读屏用户听到的是「编辑框，空」，
     * 填什么全靠猜。占位文案不算名字——它一开始打字就消失了。
     */
    ariaLabel?: string
  }>(),
  {
    modelValue: null,
    min: Number.NEGATIVE_INFINITY,
    max: Number.POSITIVE_INFINITY,
    step: 1,
    precision: 0,
    disabled: false,
    invalid: false,
    placeholder: '',
    hideStep: false,
    ariaLabel: ''
  }
)

/*
 * 尺寸跟随 ConfigProvider，但组件自己传了就以自己的为准。
 * 与文案字典同一条规则：全局配置是兜底，不是强制。
 *
 * 所以 size 不能写进 withDefaults——写了就分不清「没传」与「传了 md」，
 * 而这两者在这里的行为不同。下面这个同名计算属性在模板里会盖住那个属性。
 */
const { size: configSize } = useConfig()
const size = computed(() => props.size ?? configSize.value)

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

/** 夹取与取整走公共层，各端同一套规则 */
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
      $attrs.class,
      `i-input-number--${size}`,
      { 'is-focused': focused, 'is-disabled': disabled, 'is-invalid': invalid }
    ]"
    :style="$attrs.style"
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
      v-bind="{ ...$attrs, class: undefined, style: undefined }"
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
      :aria-label="ariaLabel || undefined"
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
