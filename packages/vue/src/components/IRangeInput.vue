<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IRangeInput.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useConfig } from './useConfig'
import { ref } from 'vue'
import { orderRange, type RangeValue } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    placeholders?: [string, string]
    separator?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    invalid?: boolean
    /**
     * 失焦时若起大于止就自动对调。
     * 只在失焦时做，不在输入过程中做——用户把 100 改成 10 的中途，
     * 数值会短暂小于起点，这时对调会把他刚敲的字搬到另一个框里。
     */
    autoOrder?: boolean
  }>(),
  {
    placeholders: () => ['开始', '结束'],
    separator: '—',
    disabled: false,
    invalid: false,
    autoOrder: true
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

const model = defineModel<RangeValue>({ default: () => ['', ''] as RangeValue })
const emit = defineEmits<{ (e: 'change', a0: RangeValue): void }>()

const focused = ref(false)

function setPart(index: 0 | 1, value: string) {
  const next: RangeValue = index === 0 ? [value, model.value[1]] : [model.value[0], value]
  model.value = next
}

function onBlur() {
  focused.value = false
  const ordered = props.autoOrder ? orderRange(model.value) : model.value
  if (ordered !== model.value) model.value = ordered
  emit('change', model.value)
}
</script>

<template>
  <div
    class="i-range-input"
    :class="[
      `i-range-input--${size}`,
      { 'is-focused': focused, 'is-disabled': disabled, 'is-invalid': invalid }
    ]"
  >
    <input
      class="i-range-input__field"
      :value="model[0]"
      :placeholder="placeholders[0]"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      :aria-label="placeholders[0]"
      @input="setPart(0, ($event.target).value)"
      @focus="focused = true"
      @blur="onBlur"
    />

    <span class="i-range-input__separator" aria-hidden="true">{{ separator }}</span>

    <input
      class="i-range-input__field i-range-input__field--end"
      :value="model[1]"
      :placeholder="placeholders[1]"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      :aria-label="placeholders[1]"
      @input="setPart(1, ($event.target).value)"
      @focus="focused = true"
      @blur="onBlur"
    />
  </div>
</template>
