<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { countdownInterval, countdownParts, formatCountdown } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 倒计时总时长（毫秒），与 endTime 二选一 */
    time?: number
    /** 结束时刻（时间戳）；跨页面刷新仍然准，优先于 time */
    endTime?: number
    format?: string
    /** 毫秒级刷新：秒杀这类场景需要，代价是每 50ms 重绘一次 */
    millisecond?: boolean
    autoStart?: boolean
    /** 拆成一格一个数字：视觉上更像「计时器」，也便于单独强调 */
    separated?: boolean
  }>(),
  {
    time: 0,
    endTime: 0,
    format: 'HH:mm:ss',
    millisecond: false,
    autoStart: true,
    separated: false
  }
)

const emit = defineEmits<{ end: []; change: [number] }>()

const remaining = ref(props.time)
const running = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let deadline = 0

/*
 * 剩余时间按目标时刻反算，而不是每次减去一个间隔。
 *
 * 页面切到后台时定时器会被节流，累减的写法会越走越慢——回到前台一看，
 * 倒计时比真实时间多出好几秒。记住 deadline 就没有这个问题。
 */
function step() {
  remaining.value = Math.max(0, deadline - Date.now())
  emit('change', remaining.value)
  if (remaining.value <= 0) {
    running.value = false
    emit('end')
    return
  }
  timer = setTimeout(step, countdownInterval(remaining.value, props.millisecond))
}

function start() {
  if (running.value) return
  deadline = props.endTime || Date.now() + (remaining.value || props.time)
  running.value = true
  step()
}

function pause() {
  running.value = false
  if (timer) clearTimeout(timer)
  timer = null
}

function reset() {
  pause()
  remaining.value = props.endTime ? Math.max(0, props.endTime - Date.now()) : props.time
}

defineExpose({ start, pause, reset })

const text = computed(() => formatCountdown(remaining.value, props.format))
const parts = computed(() => {
  const p = countdownParts(remaining.value)
  const cells: { value: string; label: string }[] = []
  if (props.format.includes('D')) cells.push({ value: String(p.days), label: '天' })
  if (props.format.includes('H')) cells.push({ value: String(p.hours).padStart(2, '0'), label: '时' })
  if (props.format.includes('m')) cells.push({ value: String(p.minutes).padStart(2, '0'), label: '分' })
  if (props.format.includes('s')) cells.push({ value: String(p.seconds).padStart(2, '0'), label: '秒' })
  return cells
})

onMounted(() => {
  reset()
  if (props.autoStart) start()
})
onBeforeUnmount(pause)
watch(() => [props.time, props.endTime], reset)
</script>

<template>
  <!--
    role="timer" + aria-live="off"：读屏不该每秒播报一次剩余时间，
    那会把整个页面的朗读淹掉；需要时用户可以主动聚焦读取。
  -->
  <div class="i-countdown" role="timer" aria-live="off" :aria-label="`剩余 ${text}`">
    <template v-if="separated">
      <span v-for="cell in parts" :key="cell.label" class="i-countdown__group">
        <span class="i-countdown__cell">{{ cell.value }}</span>
        <span class="i-countdown__unit">{{ cell.label }}</span>
      </span>
    </template>
    <span v-else class="i-countdown__text">{{ text }}</span>
  </div>
</template>
