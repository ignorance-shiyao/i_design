<script setup lang="ts">
import { computed, inject, ref, watchEffect } from 'vue'
import IIcon from './IIcon.vue'
import { checkboxGroupKey } from './context'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /** 置于 CheckboxGroup 内时作为该项的值 */
    value?: string | number
    disabled?: boolean
    /** 半选态，仅影响视觉，常用于「全选」父项 */
    indeterminate?: boolean
    /**
     * 无障碍名。
     *
     * 勾选框旁边没有可见文字时必须给（表头的全选、表格行首的那一列）：
     * 读屏用户听到的是「勾选框，未选中」，选的是哪一行全靠猜。
     */
    ariaLabel?: string
  }>(),
  { modelValue: false, value: undefined, disabled: false, indeterminate: false, ariaLabel: '' }
)

const emit = defineEmits<{ 'update:modelValue': [boolean]; change: [boolean] }>()

const group = inject(checkboxGroupKey, null)

const checked = computed(() =>
  group && props.value !== undefined ? group.value.value.includes(props.value) : props.modelValue
)
const disabled = computed(() => {
  if (props.disabled || group?.disabled.value) return true
  // 达到 max 后，未选中的项不可再勾选，已选中的仍可取消
  return Boolean(group?.atMax.value && !checked.value)
})

function toggle() {
  if (disabled.value) return
  const next = !checked.value
  if (group && props.value !== undefined) group.toggle(props.value, next)
  else {
    emit('update:modelValue', next)
    emit('change', next)
  }
}

/* 半选是 DOM 属性，模板绑不上，只能挂 ref 同步 */
const input = ref<HTMLInputElement | null>(null)
watchEffect(() => {
  if (input.value) input.value.indeterminate = props.indeterminate
})
</script>

<template>
  <label
    class="i-checkbox"
    :class="{ 'is-checked': checked, 'is-disabled': disabled, 'is-indeterminate': indeterminate }"
  >
    <!--
      半选态走原生的 indeterminate 属性，而不是 aria-checked="mixed"：
      原生 checkbox 的半选是一个 DOM 属性，读屏据此播报「部分选中」；
      只写 aria 的话，属性与状态对不上，读屏播报的仍是「未选中」。
    -->
    <input
      ref="input"
      class="i-checkbox__input"
      type="checkbox"
      :checked="checked"
      :disabled="disabled"
      :aria-label="ariaLabel || undefined"
      @change="toggle"
    />
    <span class="i-checkbox__mark" aria-hidden="true">
      <IIcon v-if="checked && !indeterminate" name="check" :size="12" :stroke-width="3" />
      <span v-else-if="indeterminate" class="i-checkbox__dash" />
    </span>
    <span class="i-checkbox__label"><slot /></span>
  </label>
</template>
