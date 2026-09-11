<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITimeSelect.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import ISelectInput from './ISelectInput.vue'
import { timeSelectOptions } from '@i-design/common'

/**
 * 固定间隔的时间下拉。
 *
 * 与 TimePicker 的分工：能选任意时刻的用 TimePicker，只在若干个整点或半点里挑的
 * 用这个——用三列滚轮去选「上午九点半」既慢又容易滑过头。
 *
 * 序列与禁用判定在 logic/time 的 timeSelectOptions，各端共用同一份。
 */
const props = withDefaults(
  defineProps<{
    /** 首个时间点 */
    start?: string
    /** 末个时间点（含） */
    end?: string
    /** 间隔分钟数 */
    step?: number
    /** 早于它的不可选，用于「结束时间不能早于开始时间」 */
    minTime?: string
    maxTime?: string
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
  }>(),
  {
    start: '09:00',
    end: '18:00',
    step: 30,
    minTime: '',
    maxTime: '',
    placeholder: '选择时间',
    disabled: false,
    invalid: false
  }
)

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ (e: 'change', a0: string): void }>()

const open = ref(false)

const options = computed(() =>
  timeSelectOptions({
    start: props.start,
    end: props.end,
    step: props.step,
    minTime: props.minTime || undefined,
    maxTime: props.maxTime || undefined
  })
)

function pick(value: string) {
  model.value = value
  emit('change', value)
  open.value = false
}
</script>

<template>
  <div class="i-time-select">
    <!-- 外壳复用 ISelectInput：聚焦态、清除键、箭头都该与其他选择器一致 -->
    <ISelectInput
      v-model:open="open"
      :value="model"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="invalid"
      clearable
      @clear="pick('')"
    />

    <div v-if="open" class="i-time-select__panel" role="listbox">
      <button
        v-for="option in options"
        :key="option.value"
        class="i-time-select__option"
        :class="{ 'is-active': option.value === model }"
        type="button"
        role="option"
        :aria-selected="String(option.value === model)"
        :disabled="option.disabled"
        @click="pick(option.value)"
      >
        {{ option.value }}
      </button>
    </div>
  </div>
</template>
