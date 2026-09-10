<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/INumberKeypad.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import IIcon from './IIcon.vue'
import { keyLabel, keypadRows, pressKey, type KeypadKey } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    value?: string
    /** 最多几位小数。0 表示不允许小数点 */
    decimals?: number
    /** 最大长度，按字符数算（含小数点与负号） */
    maxLength?: number
    /** 允许负数，键盘上多一个 +/- 键 */
    negative?: boolean
    /** 右侧的确认列。金额场景常见，验证码场景不需要 */
    confirmText?: string
  }>(),
  { value: '', decimals: 2, maxLength: 12, negative: false, confirmText: '' }
)

const emit = defineEmits<{ (e: 'input', a0: string): void; (e: 'confirm', a0: string): void }>()

const rows = computed(() => keypadRows({ decimals: props.decimals, negative: props.negative }))

function press(key: KeypadKey) {
  if (!key) return
  emit(
    'input',
    pressKey(props.value, key, {
      decimals: props.decimals,
      maxLength: props.maxLength,
      negative: props.negative
    })
  )
}

/** 长按删除键连续退格：输错一长串时一下一下点太慢 */
let repeat: ReturnType<typeof setInterval> | null = null
let delay: ReturnType<typeof setTimeout> | null = null

function holdStart(key: KeypadKey) {
  if (key !== 'backspace') return
  delay = setTimeout(() => {
    repeat = setInterval(() => press('backspace'), 80)
  }, 400)
}

function holdEnd() {
  if (delay) clearTimeout(delay)
  if (repeat) clearInterval(repeat)
  delay = null
  repeat = null
}
</script>

<template>
  <!--
    role="group" 而不是一堆裸按钮：读屏进来时先念出「数字键盘」，
    使用者才知道接下来这十几个按钮是一组，而不是页面上散落的操作。
  -->
  <div class="i-keypad" role="group" aria-label="数字键盘">
    <div class="i-keypad__pad">
      <template v-for="(row, r) in rows" :key="r">
        <button
          v-for="(key, k) in row"
          :key="`${r}-${k}`"
          class="i-keypad__key"
          :class="{
            'i-keypad__key--fn': key === 'backspace' || key === 'sign',
            'is-empty': key === ''
          }"
          :disabled="key === ''"
          :aria-label="keyLabel(key)"
          type="button"
          @click="press(key)"
          @pointerdown="holdStart(key)"
          @pointerup="holdEnd"
          @pointerleave="holdEnd"
          @pointercancel="holdEnd"
        >
          <IIcon v-if="key === 'backspace'" name="close" :size="18" />
          <template v-else-if="key === 'sign'">+/−</template>
          <template v-else>{{ key }}</template>
        </button>
      </template>
    </div>

    <!-- 确认键竖跨两格：它是这块键盘上唯一一个「结束输入」的键，得比数字键显眼 -->
    <button
      v-if="confirmText"
      class="i-keypad__confirm"
      type="button"
      @click="emit('confirm', value)"
    >
      {{ confirmText }}
    </button>
  </div>
</template>
