<!--
  Vue 2.7 人工实现：2.7 没有 Teleport，改用 _Portal 在挂载后把面板搬到 body。
  其余行为与 src/components/ITimePicker.vue 一致。
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import IPortal from './_Portal.vue'
import IIcon from './IIcon.vue'
import {
  ZERO,
  clampTime,
  formatTime,
  isUnitEnabled,
  parseTime,
  resolveOverlay,
  timeColumn,
  type TimeValue
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** HH:mm 或 HH:mm:ss；空串表示未选 */
    value?: string
    placeholder?: string
    showSecond?: boolean
    /** 时 / 分 / 秒各自的步长 */
    hourStep?: number
    minuteStep?: number
    secondStep?: number
    /** 可选范围，含端点 */
    min?: string
    max?: string
    disabled?: boolean
    clearable?: boolean
  }>(),
  {
    value: '',
    placeholder: '选择时间',
    showSecond: true,
    hourStep: 1,
    minuteStep: 1,
    secondStep: 1,
    min: '',
    max: '',
    disabled: false,
    clearable: true
  }
)

const emit = defineEmits<{ (e: 'input', a0: string): void }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const position = ref({ x: 0, y: 0 })

const bounds = computed(() => ({
  min: props.min ? parseTime(props.min) ?? undefined : undefined,
  max: props.max ? parseTime(props.max) ?? undefined : undefined
}))

/** 面板打开时的工作值。未选时落在范围起点，而不是 00:00——那可能根本不可选 */
const draft = ref<TimeValue>(ZERO)

watch(
  () => props.value,
  (v) => {
    const parsed = v ? parseTime(v) : null
    draft.value = parsed ?? bounds.value.min ?? ZERO
  },
  { immediate: true }
)

const units = computed(() =>
  (props.showSecond ? ['hour', 'minute', 'second'] : ['hour', 'minute']) as ('hour' | 'minute' | 'second')[]
)

const columns = computed(() =>
  units.value.map((unit) => ({
    unit,
    values: timeColumn(unit, unit === 'hour' ? props.hourStep : unit === 'minute' ? props.minuteStep : props.secondStep)
  }))
)

const label = computed(() => (props.value ? props.value : ''))

async function place() {
  const trigger = root.value?.getBoundingClientRect()
  await nextTick()
  const box = panel.value
  if (!trigger || !box) return
  const resolved = resolveOverlay({
    trigger: { x: trigger.x, y: trigger.y, width: trigger.width, height: trigger.height },
    // 量 offsetWidth 而不是 getBoundingClientRect：入场动画里有 scale，
    // 用带变换的尺寸算出来的位置会偏几个像素
    popup: { x: 0, y: 0, width: box.offsetWidth, height: box.offsetHeight },
    viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
    placement: 'bottom',
    align: 'start',
    offset: 4
  })
  position.value = { x: resolved.x, y: resolved.y }
}

async function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    await place()
    await scrollToActive()
  }
}

/*
 * 打开时把当前值滚到列的中间。
 *
 * 不滚的话，选 23:45 时打开面板看到的是 00 开头的一列——用户会以为值丢了，
 * 而实际上它在下面五百像素处。
 */
async function scrollToActive() {
  await nextTick()
  panel.value?.querySelectorAll('.i-timepicker__col').forEach((col) => {
    const active = col.querySelector<HTMLElement>('.is-active')
    if (active) col.scrollTop = active.offsetTop - col.clientHeight / 2 + active.clientHeight / 2
  })
}

function pick(unit: 'hour' | 'minute' | 'second', value: number) {
  if (!isUnitEnabled(unit, value, draft.value, bounds.value)) return
  const next = clampTime(
    { ...draft.value, [unit]: value },
    {
      min: bounds.value.min,
      max: bounds.value.max,
      showSecond: props.showSecond,
      step: { hour: props.hourStep, minute: props.minuteStep, second: props.secondStep }
    }
  )
  draft.value = next
  emit('input', formatTime(next, props.showSecond))
}

function clear(event: Event) {
  event.stopPropagation()
  emit('input', '')
  open.value = false
}

function now() {
  const d = new Date()
  pick('hour', d.getHours())
  draft.value = clampTime(
    { hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() },
    {
      min: bounds.value.min,
      max: bounds.value.max,
      showSecond: props.showSecond,
      step: { hour: props.hourStep, minute: props.minuteStep, second: props.secondStep }
    }
  )
  emit('input', formatTime(draft.value, props.showSecond))
  scrollToActive()
}

const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <div ref="root" class="i-timepicker" :class="{ 'is-disabled': disabled }">
    <button
      class="i-timepicker__trigger"
      type="button"
      :disabled="disabled"
      :aria-expanded="String(open)"
      aria-haspopup="dialog"
      @click="toggle"
      @blur="open = false"
    >
      <IIcon name="clock" :size="15" />
      <span :class="{ 'is-placeholder': !label }">{{ label || placeholder }}</span>
      <span
        v-if="clearable && label && !disabled"
        class="i-timepicker__clear"
        role="button"
        aria-label="清除"
        @mousedown.prevent="clear"
      >
        <IIcon name="close" :size="12" />
      </span>
    </button>

    <!-- 2.7 没有 Teleport，_Portal 在挂载后把节点搬到 body -->
    <IPortal>
      <div
        v-if="open"
        ref="panel"
        class="i-timepicker__panel"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      >
        <div class="i-timepicker__cols">
          <ul v-for="col in columns" :key="col.unit" class="i-timepicker__col" role="listbox">
            <li
              v-for="value in col.values"
              :key="value"
              class="i-timepicker__cell"
              :class="{
                'is-active': draft[col.unit] === value,
                'is-disabled': !isUnitEnabled(col.unit, value, draft, bounds)
              }"
              role="option"
              :aria-selected="String(draft[col.unit] === value)"
              @mousedown.prevent="pick(col.unit, value)"
            >
              {{ pad(value) }}
            </li>
          </ul>
        </div>
        <footer class="i-timepicker__foot">
          <!-- 「此刻」不是装饰：绝大多数时间输入填的就是现在，让人少滚三列 -->
          <button type="button" class="i-timepicker__now" @mousedown.prevent="now">此刻</button>
          <button type="button" class="i-timepicker__done" @mousedown.prevent="open = false">确定</button>
        </footer>
      </div>
    </IPortal>
  </div>
</template>
