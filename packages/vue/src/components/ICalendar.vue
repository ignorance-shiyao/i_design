<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ICalendar.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'
import {
  addMonths,
  buildCalendar,
  groupMarks,
  isInRange,
  isRangeEdge,
  moveFocus,
  parseISO,
  selectRange,
  toISO,
  weekdayLabels,
  type CalendarMark,
  type DateRange
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 单选：ISO 日期；范围选：起止两个 ISO */
    value?: string | DateRange
    mode?: 'single' | 'range'
    /** 日程标记 */
    marks?: CalendarMark[]
    weekStart?: 0 | 1
    /** 可选范围之外的日期禁用 */
    min?: string
    max?: string
  }>(),
  { value: '', mode: 'single', marks: () => [], weekStart: 1, min: '', max: '' }
)

const emit = defineEmits<{ (e: 'input', a0: string | DateRange): void; (e: 'select', a0: string): void }>()

const view = ref(parseISO(typeof props.value === 'string' ? props.value : props.value?.start) ?? new Date())
const focused = ref<string>(toISO(view.value))

const cells = computed(() => buildCalendar(view.value, props.weekStart))
const marksByDate = computed(() => groupMarks(props.marks))
const labels = computed(() => weekdayLabels(props.weekStart))

const range = computed<DateRange>(() =>
  typeof props.value === 'string'
    ? { start: props.value || null, end: null }
    : props.value ?? { start: null, end: null }
)

const title = computed(() => `${view.value.getFullYear()} 年 ${view.value.getMonth() + 1} 月`)

const disabled = (iso: string) => (props.min && iso < props.min) || (props.max && iso > props.max)

function shift(delta: number) {
  view.value = addMonths(view.value, delta)
}

function pick(iso: string) {
  if (disabled(iso)) return
  focused.value = iso
  if (props.mode === 'range') {
    emit('input', selectRange(range.value, iso))
  } else {
    emit('input', iso)
  }
  emit('select', iso)
}

/*
 * 日历必须能用键盘走完。只能点的话，用键盘操作的人要选一个三个月后的日期，
 * 得先用 Tab 穿过前面所有格子——42 个格子，每换一个月再来一遍。
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    pick(focused.value)
    return
  }
  const next = moveFocus(focused.value, event.key)
  if (!next) return
  event.preventDefault()
  focused.value = next
  // 走出当前月就翻页，否则焦点会落在一个看不见的格子上
  const target = parseISO(next)
  if (target && target.getMonth() !== view.value.getMonth()) view.value = target
}

const cellClass = (iso: string, outside: boolean, today: boolean) => ({
  'is-outside': outside,
  'is-today': today,
  'is-disabled': disabled(iso),
  'is-selected': isRangeEdge(iso, range.value) !== null,
  'is-in-range': props.mode === 'range' && isInRange(iso, range.value),
  'is-start': isRangeEdge(iso, range.value) === 'start',
  'is-end': isRangeEdge(iso, range.value) === 'end'
})
</script>

<template>
  <div class="i-calendar">
    <header class="i-calendar__head">
      <button class="i-calendar__nav" type="button" aria-label="上个月" @click="shift(-1)">
        <IIcon name="chevron-left" :size="16" />
      </button>
      <span class="i-calendar__title" aria-live="polite">{{ title }}</span>
      <button class="i-calendar__nav" type="button" aria-label="下个月" @click="shift(1)">
        <IIcon name="chevron-right" :size="16" />
      </button>
    </header>

    <!--
      role="grid" 加上格子的 tabindex 轮换：整块日历只占一个 Tab 停靠点，
      进来之后用方向键走。42 个格子各占一个 Tab 位的话，
      用键盘的人要按四十几下才能穿过这个月。
    -->
    <div class="i-calendar__grid" role="grid" tabindex="0" @keydown="onKeydown">
      <span v-for="label in labels" :key="label" class="i-calendar__weekday" role="columnheader">
        {{ label }}
      </span>

      <button
        v-for="cell in cells"
        :key="cell.iso"
        class="i-calendar__cell"
        :class="cellClass(cell.iso, cell.outside, cell.today)"
        type="button"
        role="gridcell"
        :tabindex="-1"
        :aria-selected="String(isRangeEdge(cell.iso, range) !== null)"
        :aria-current="cell.today ? 'date' : undefined"
        :disabled="!!disabled(cell.iso)"
        @click="pick(cell.iso)"
      >
        <span class="i-calendar__day">{{ cell.day }}</span>
        <!--
          标记用「图标色点 + 文字」而不是给整格换底色：
          换底色会和「选中」「今天」这两种状态抢同一个视觉通道，
          三者叠在一起时读者分不出哪个是哪个。
        -->
        <span v-if="marksByDate.get(cell.iso)?.length" class="i-calendar__marks">
          <span
            v-for="(mark, i) in marksByDate.get(cell.iso)!.slice(0, 2)"
            :key="i"
            class="i-calendar__mark"
            :class="`is-${mark.type ?? 'brand'}`"
            :title="mark.label"
          >
            {{ mark.label }}
          </span>
          <span v-if="marksByDate.get(cell.iso)!.length > 2" class="i-calendar__more">
            +{{ marksByDate.get(cell.iso)!.length - 2 }}
          </span>
        </span>
      </button>
    </div>
  </div>
</template>
