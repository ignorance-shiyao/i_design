<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  normalizeValue,
  pickerText,
  resolveColumns,
  type PickerColumns
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 选中值，每列一个 */
    modelValue: (string | number)[]
    /** 并列多列传二维数组；级联传一维数组，下级放在 children 里 */
    columns: PickerColumns
    title?: string
    cancelText?: string
    okText?: string
    /** 可见候选行数，取奇数才有居中的那一行 */
    visibleCount?: number
  }>(),
  { title: '', cancelText: '取消', okText: '确定', visibleCount: 5 }
)

const emit = defineEmits<{
  'update:modelValue': [(string | number)[]]
  confirm: [(string | number)[]]
  cancel: []
}>()

const ROW = 40

/*
 * 滚动期间先在内部维护一份草稿值，确认时才抛出去。
 *
 * 直接每滚一格就 emit，调用方拿到的是一串中间态；而移动端选择器的语义
 * 本来就是「滚完按确定」——中途的值不是用户的选择。
 */
const draft = ref<(string | number)[]>(normalizeValue(props.columns, props.modelValue))
watch(
  () => [props.modelValue, props.columns],
  () => {
    draft.value = normalizeValue(props.columns, props.modelValue)
    nextTick(syncScroll)
  },
  { deep: true }
)

const columnList = computed(() => resolveColumns(props.columns, draft.value))
const wheels = ref<HTMLElement[]>([])

/** 把每一列滚到当前选中项：外部改值、或上一列变动导致本列重算时都要对齐 */
function syncScroll() {
  columnList.value.forEach((options, col) => {
    const index = Math.max(0, options.findIndex((o) => o.value === draft.value[col]))
    const el = wheels.value[col]
    if (el) el.scrollTop = index * ROW
  })
}

let settle: ReturnType<typeof setTimeout> | null = null

function onScroll(col: number, event: Event) {
  /*
   * 没有 scrollend 事件的浏览器仍占多数，这里用「停止滚动 80ms」判定落定。
   * 用 scroll-snap 让浏览器负责吸附到整行，我们只负责读出停在第几行——
   * 自己写惯性和回弹，在不同浏览器上手感永远对不齐。
   */
  const el = event.target as HTMLElement
  if (settle) clearTimeout(settle)
  settle = setTimeout(() => {
    const options = columnList.value[col] ?? []
    const index = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ROW)))
    const option = options[index]
    if (!option || option.disabled) {
      syncScroll()
      return
    }
    const next = draft.value.slice(0, col)
    next[col] = option.value
    // 后面几列由这一列决定，交给 normalizeValue 重算，避免留下不存在的旧值
    draft.value = normalizeValue(props.columns, next)
    nextTick(syncScroll)
  }, 80)
}

function confirm() {
  emit('update:modelValue', draft.value)
  emit('confirm', draft.value)
}

const text = computed(() => pickerText(props.columns, draft.value))
defineExpose({ text })
</script>

<template>
  <div class="i-picker">
    <div class="i-picker__bar">
      <button type="button" class="i-picker__action" @click="emit('cancel')">{{ cancelText }}</button>
      <span class="i-picker__title">{{ title }}</span>
      <button type="button" class="i-picker__action is-primary" @click="confirm">{{ okText }}</button>
    </div>

    <div class="i-picker__body" :style="{ height: `${visibleCount * ROW}px` }">
      <!-- 选中行的上下两条线：没有它，用户不知道到底哪一行才算选中 -->
      <div class="i-picker__indicator" :style="{ height: `${ROW}px` }" />

      <div
        v-for="(options, col) in columnList"
        :key="`col-${col}`"
        ref="wheels"
        class="i-picker__wheel"
        role="listbox"
        :aria-label="`第 ${col + 1} 列`"
        @scroll="onScroll(col, $event)"
      >
        <!-- 首尾各留半屏空白，第一项和最后一项才滚得到中间那一行 -->
        <div class="i-picker__pad" :style="{ height: `${((visibleCount - 1) / 2) * ROW}px` }" />
        <div
          v-for="option in options"
          :key="option.value"
          class="i-picker__option"
          :class="{ 'is-active': option.value === draft[col], 'is-disabled': option.disabled }"
          :style="{ height: `${ROW}px` }"
          role="option"
          :aria-selected="option.value === draft[col]"
        >
          {{ option.text }}
        </div>
        <div class="i-picker__pad" :style="{ height: `${((visibleCount - 1) / 2) * ROW}px` }" />
      </div>
    </div>
  </div>
</template>
