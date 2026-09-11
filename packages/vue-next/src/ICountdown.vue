<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { countdownInterval, countdownRemaining, formatCountdown } from '@i-design/common'

/**
 * 倒计时。
 *
 * 每一跳都从绝对截止时刻重算，而不是把上一次的值减掉一个间隔：
 * 后者每跳都会积累几毫秒误差，页面挂一晚上能差出好几秒；
 * 标签页被切到后台时定时器还会被浏览器压到每秒一次以下，回来就直接错了。
 * 取整与格式化规则在 logic/countdown，各端共用同一份。
 */
const props = withDefaults(
  defineProps<{
    /** 截止时刻的时间戳（毫秒） */
    value: number
    /** 模板：DD / HH / mm / ss / SSS，小写单字母不补零 */
    format?: string
    title?: string
    prefix?: string
    suffix?: string
    type?: 'default' | 'brand' | 'success' | 'danger'
    size?: 'md' | 'sm'
    /** 暂停。改成 false 后再打开，走的仍是绝对时刻，不会「补回」暂停期间的时间 */
    running?: boolean
  }>(),
  {
    format: 'HH:mm:ss',
    title: '',
    prefix: '',
    suffix: '',
    type: 'default',
    size: 'md',
    running: true
  }
)

const emit = defineEmits<{ change: [number]; finish: [] }>()

const showMs = computed(() => /S/.test(props.format))
const remaining = ref(countdownRemaining(props.value, Date.now()))
const display = computed(() => formatCountdown(remaining.value, props.format))
const finished = computed(() => remaining.value <= 0)

let timer: ReturnType<typeof setTimeout> | null = null

function stop() {
  if (timer !== null) clearTimeout(timer)
  timer = null
}

function tick() {
  const left = countdownRemaining(props.value, Date.now())
  const wasRunning = remaining.value > 0
  remaining.value = left
  emit('change', left)
  if (left <= 0) {
    stop()
    // 只在真正走到零的那一次发 finish：截止时刻早已过去时挂载不该触发，
    // 否则刷新页面会把「结束」的副作用（跳转、弹窗）再跑一遍
    if (wasRunning) emit('finish')
    return
  }
  timer = setTimeout(tick, countdownInterval(left, showMs.value))
}

function start() {
  stop()
  remaining.value = countdownRemaining(props.value, Date.now())
  if (!props.running || remaining.value <= 0) return
  timer = setTimeout(tick, countdownInterval(remaining.value, showMs.value))
}

onMounted(start)
onBeforeUnmount(stop)
watch(() => [props.value, props.running, props.format], start)
</script>

<template>
  <div
    class="i-countdown i-countdown--block"
    :class="[`i-countdown--${type}`, `i-countdown--${size}`, { 'is-finished': finished }]"
  >
    <div v-if="title" class="i-countdown__title">{{ title }}</div>
    <div class="i-countdown__value">
      <span v-if="prefix" class="i-countdown__affix">{{ prefix }}</span>
      <span>
        <slot :remaining="remaining" :text="display">{{ display }}</slot>
      </span>
      <span v-if="suffix" class="i-countdown__affix">{{ suffix }}</span>
    </div>
  </div>
</template>
