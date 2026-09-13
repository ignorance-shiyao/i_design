<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IDatePicker.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import {
  addDays,
  addMonths,
  buildCalendar,
  formatDate,
  isSameDay,
  parseISO,
  startOfMonth,
  toISO,
  weekdayLabels
} from './date'
import { shouldFlipUp } from '@i-design/common'
import { useConfig } from './useConfig'

const props = withDefaults(
  defineProps<{
    /** YYYY-MM-DD 字符串；空值用 null 表示 */
    value?: string | null
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    invalid?: boolean
    clearable?: boolean
    /** 可选范围，闭区间，同样是 YYYY-MM-DD */
    min?: string
    max?: string
    /** 更细的禁用规则，优先级低于 min/max */
    disabledDate?: (date: Date) => boolean
    /** 仅影响输入框里的显示，对外的值始终是 YYYY-MM-DD */
    format?: string
    weekStart?: 0 | 1
  }>(),
  {
    value: null,
    placeholder: '',
    disabled: false,
    invalid: false,
    clearable: false,
    min: '',
    max: '',
    disabledDate: undefined,
    format: 'YYYY-MM-DD',
    weekStart: 1
  }
)

const { locale, size: configSize } = useConfig()

/*
 * 尺寸跟随 ConfigProvider，但组件自己传了就以自己的为准。
 * 与文案字典同一条规则：全局配置是兜底，不是强制。
 *
 * 所以 size 不能写进 withDefaults——写了就分不清「没传」与「传了 md」，
 * 而这两者在这里的行为不同。下面这个同名计算属性在模板里会盖住那个属性。
 */
const size = computed(() => props.size ?? configSize.value)
/* 传了就用传的，没传才回落到字典——组件自己的默认值不该盖过调用方 */
const placeholderText = computed(() => props.placeholder || locale.value.datePlaceholder)

const emit = defineEmits<{ (e: 'input', a0: string | null): void; (e: 'change', a0: string | null): void }>()

const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
/*
 * 面板往上还是往下开：它贴着触发器用绝对定位，触发器一靠近视口底缘，
 * 整块日历就掉到屏幕外。判断放在公共层，几个同类面板给出的结论才一致。
 */
const flipUp = ref(false)
const open = ref(false)

const selected = computed(() => parseISO(props.value))
/** 面板当前展示的月份；未选中时落在今天所在月 */
const viewDate = ref(startOfMonth(selected.value ?? new Date()))
/** 键盘导航的焦点日期，与选中值分离，这样方向键浏览时不会立刻改值 */
const cursor = ref<Date>(selected.value ?? new Date())

const cells = computed(() => buildCalendar(viewDate.value, props.weekStart))
const weekdays = computed(() => weekdayLabels(props.weekStart))
const display = computed(() => (selected.value ? formatDate(selected.value, props.format) : ''))
const title = computed(() => `${viewDate.value.getFullYear()} 年 ${viewDate.value.getMonth() + 1} 月`)

function isDisabled(date: Date) {
  const iso = toISO(date)
  if (props.min && iso < props.min) return true
  if (props.max && iso > props.max) return true
  return props.disabledDate ? props.disabledDate(date) : false
}

function openPanel() {
  if (props.disabled) return
  open.value = true
  const base = selected.value ?? new Date()
  viewDate.value = startOfMonth(base)
  cursor.value = base
  /* 量一次当前位置决定方向。开的时候量，不跟着滚动实时翻——半途翻向会让人点空 */
  nextTick(() => {
    const trigger = root.value?.getBoundingClientRect()
    const box = panel.value?.getBoundingClientRect()
    if (trigger && box) flipUp.value = shouldFlipUp(trigger, box.height, window.innerHeight)
  })
}

function close() {
  open.value = false
  flipUp.value = false
}

function pick(date: Date) {
  if (isDisabled(date)) return
  const iso = toISO(date)
  emit('input', iso)
  emit('change', iso)
  close()
}

function clear() {
  emit('input', null)
  emit('change', null)
}

function shiftMonth(delta: number) {
  viewDate.value = addMonths(viewDate.value, delta)
}

function goToday() {
  const today = new Date()
  viewDate.value = startOfMonth(today)
  cursor.value = today
  if (!isDisabled(today)) pick(today)
}

/** 方向键移动焦点日期，越出当前月时面板自动翻页 */
function moveCursor(days: number) {
  const next = addDays(cursor.value, days)
  cursor.value = next
  if (next.getMonth() !== viewDate.value.getMonth()) viewDate.value = startOfMonth(next)
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  if (!open.value) {
    if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      openPanel()
    }
    return
  }
  switch (event.key) {
    case 'ArrowLeft': event.preventDefault(); moveCursor(-1); break
    case 'ArrowRight': event.preventDefault(); moveCursor(1); break
    case 'ArrowUp': event.preventDefault(); moveCursor(-7); break
    case 'ArrowDown': event.preventDefault(); moveCursor(7); break
    case 'PageUp': event.preventDefault(); shiftMonth(-1); break
    case 'PageDown': event.preventDefault(); shiftMonth(1); break
    case 'Enter':
    case ' ':
      event.preventDefault()
      pick(cursor.value)
      break
    case 'Escape':
      close()
      break
  }
}

function onClickOutside(event: MouseEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

// 外部改值时同步面板月份，避免再次打开还停在旧月份
watch(selected, (value) => {
  if (value) {
    viewDate.value = startOfMonth(value)
    cursor.value = value
  }
})

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="i-date" :class="[`i-date--${size}`, { 'is-open': open, 'is-up': flipUp }]">
    <button
      class="i-date__trigger"
      :class="{ 'is-invalid': invalid, 'is-placeholder': !selected }"
      type="button"
      :disabled="disabled"
      aria-haspopup="dialog"
      :aria-expanded="String(open)"
      @click="open ? close() : openPanel()"
      @keydown="onKeydown"
    >
      <IIcon class="i-date__calendar" name="calendar" :size="15" />
      <span class="i-date__value">{{ display || placeholderText }}</span>
      <span
        v-if="clearable && selected && !disabled"
        class="i-date__clear"
        role="button"
        aria-label="清除日期"
        @click.stop="clear"
      >
        <IIcon name="close" :size="14" />
      </span>
    </button>

    <div v-show="open" ref="panel" class="i-date__panel" role="dialog" :aria-label="title">
      <header class="i-date__head">
        <button type="button" class="i-date__nav" aria-label="上一月" @click="shiftMonth(-1)">
          <IIcon name="chevron-left" :size="15" />
        </button>
        <span class="i-date__title">{{ title }}</span>
        <button type="button" class="i-date__nav" aria-label="下一月" @click="shiftMonth(1)">
          <IIcon name="chevron-right" :size="15" />
        </button>
      </header>

      <div class="i-date__week">
        <span v-for="label in weekdays" :key="label">{{ label }}</span>
      </div>

      <div class="i-date__grid">
        <button
          v-for="cell in cells"
          :key="cell.iso"
          type="button"
          class="i-date__cell"
          :class="{
            'is-outside': cell.outside,
            'is-today': cell.today,
            'is-selected': isSameDay(cell.date, selected),
            'is-cursor': open && isSameDay(cell.date, cursor),
            'is-disabled': isDisabled(cell.date)
          }"
          :disabled="isDisabled(cell.date)"
          :aria-current="cell.today ? 'date' : undefined"
          @click="pick(cell.date)"
        >
          {{ cell.day }}
        </button>
      </div>

      <footer class="i-date__foot">
        <button type="button" class="i-date__action" @click="goToday">今天</button>
        <button v-if="clearable" type="button" class="i-date__action" @click="clear(); close()">
          清除
        </button>
      </footer>
    </div>
  </div>
</template>
