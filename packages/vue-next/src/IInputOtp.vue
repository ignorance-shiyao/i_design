<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  isOtpChar,
  otpBackspace,
  otpFromText,
  otpNextIndex,
  otpValue,
  type OtpMode
} from '@i-design/common'

/**
 * 验证码输入。
 *
 * 分格能让人一眼看出要填几位，也不必数自己填到第几位；代价是粘贴、删除、
 * 自动填充都得自己处理。这些规则在 logic/otp，各端共用——
 * 一端粘贴能自动分配、另一端只填进第一格的话，同一条短信在两端上体验完全不同。
 */
const props = withDefaults(
  defineProps<{
    length?: number
    /** 可接受的字符：纯数字或数字加字母 */
    mode?: OtpMode
    /** 用圆点遮住已输入的字符，格数仍然可见 */
    password?: boolean
    /** 在第几格之后插入分隔符，如 3 表示「前三位 - 后三位」 */
    separatorAt?: number
    disabled?: boolean
    invalid?: boolean
  }>(),
  {
    length: 6,
    mode: 'numeric',
    password: false,
    separatorAt: 0,
    disabled: false,
    invalid: false
  }
)

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ complete: [string] }>()

const cells = ref<string[]>(otpFromText(model.value, props.length, props.mode))
const inputs = ref<HTMLInputElement[]>([])

/* 外部改值（清空重填、自动填充）时同步进来 */
watch(
  () => model.value,
  (value) => {
    if (value === otpValue(cells.value)) return
    cells.value = otpFromText(value, props.length, props.mode)
  }
)

const complete = computed(() => otpValue(cells.value))

function focusCell(index: number) {
  const el = inputs.value[index]
  el?.focus()
  el?.select()
}

function commit() {
  model.value = complete.value
  if (complete.value) emit('complete', complete.value)
}

function onInput(index: number, event: Event) {
  const el = event.target as HTMLInputElement
  const raw = el.value
  // 取最后一个字符：格子已有值时再键入，浏览器给的是两个字符
  const char = [...raw].reverse().find((c) => isOtpChar(c, props.mode)) ?? ''
  el.value = char
  cells.value[index] = char
  commit()
  if (char) focusCell(otpNextIndex(index, props.length))
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace') {
    event.preventDefault()
    const next = otpBackspace(cells.value, index)
    cells.value = next.cells
    commit()
    focusCell(next.index)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    focusCell(Math.max(index - 1, 0))
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    focusCell(Math.min(index + 1, props.length - 1))
  }
}

/*
 * 粘贴整串验证码。短信里常带空格或连字符（「123 456」），
 * 逐字填会把空格也占掉一格，用户看到的是填了一半且顺序全乱。
 */
function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!text) return
  event.preventDefault()
  cells.value = otpFromText(text, props.length, props.mode)
  commit()
  const filled = cells.value.filter(Boolean).length
  focusCell(Math.min(filled, props.length - 1))
}
</script>

<template>
  <div
    class="i-input-otp"
    :class="{ 'i-input-otp--password': password, 'is-invalid': invalid }"
    role="group"
    :aria-label="`${length} 位验证码`"
  >
    <template v-for="(cell, index) in cells" :key="index">
      <span v-if="separatorAt && index === separatorAt" class="i-input-otp__separator">-</span>
      <input
        :ref="(el) => { if (el) inputs[index] = el as HTMLInputElement }"
        class="i-input-otp__cell"
        :value="cell"
        :disabled="disabled"
        :aria-label="`第 ${index + 1} 位`"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="2"
        @input="onInput(index, $event)"
        @keydown="onKeydown(index, $event)"
        @paste="onPaste"
        @focus="($event.target as HTMLInputElement).select()"
      />
    </template>
  </div>
</template>
