<script setup lang="ts">
/**
 * 一次运行停在哪儿。
 *
 * 出字之前的那段静止有好几种原因——在排队、在连接、断了正在重连、
 * 在等人点一下。只转一个圈的话它们长得一模一样，用户没有依据判断
 * 该继续等、该重试，还是该去检查网络。判定在 logic/lifecycle.ts，
 * 各端共用一份，免得同一个运行在这一端还能取消、在那一端按钮已经灰了。
 *
 * 秒数自己走：把「已等多久」交给使用方传，等于要求每个页面都自己开一个
 * 定时器，而且各家的进位还会不一样。这里对齐到整秒刷新（elapsedInterval），
 * 固定 1000ms 的间隔等上两分钟会明显比真实时间慢。
 */
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'
import {
  describeRun,
  elapsedInterval,
  elapsedParts,
  shouldShowElapsed,
  type ConnectionPhase,
  type RunStatus
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'

const props = withDefaults(
  defineProps<{
    status: RunStatus
    /** 队列里前面还有几个。不给表示服务端没有队列信息，界面就不编一个出来 */
    queuePosition?: number
    connection?: ConnectionPhase
    /** 第几次连接尝试，从 0 起 */
    attempt?: number
    /** 下一次重试的时刻（毫秒时间戳） */
    retryAt?: number
    /** 这次运行开始等待的时刻。给了才显示「已等 N 秒」 */
    startedAt?: number
    cancelText?: string
  }>(),
  { attempt: 0, cancelText: '取消' }
)

const emit = defineEmits<{ cancel: [] }>()

/*
 * 自己走的时钟。只有在还没结束时才跑——终态之后每秒重算一次状态，
 * 除了耗电什么也不做。
 */
const now = ref(Date.now())
let timer: ReturnType<typeof setTimeout> | undefined
const stopClock = () => {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}
onBeforeUnmount(stopClock)

const notice = computed(() =>
  describeRun({
    status: props.status,
    queuePosition: props.queuePosition,
    connection: props.connection,
    attempt: props.attempt,
    retryAt: props.retryAt,
    startedAt: props.startedAt,
    now: now.value
  })
)

watchEffect(() => {
  stopClock()
  if (!notice.value.busy) return
  const tick = () => {
    now.value = Date.now()
    timer = setTimeout(tick, elapsedInterval(Date.now()))
  }
  timer = setTimeout(tick, elapsedInterval(now.value))
})

/** 三秒以内的等待不挂计时：那点时间还来不及让人怀疑是不是卡了 */
const waited = computed(() => {
  if (props.startedAt === undefined || !shouldShowElapsed(notice.value.waited)) return ''
  const { minutes, seconds } = elapsedParts(notice.value.waited)
  return minutes > 0 ? `已等 ${minutes} 分 ${seconds} 秒` : `已等 ${seconds} 秒`
})
</script>

<template>
  <div
    class="i-run-status"
    :class="`i-run-status--${notice.tone}`"
    role="status"
    :aria-label="notice.detail ? `${notice.label}，${notice.detail}` : notice.label"
  >
    <span class="i-run-status__icon">
      <IIcon :name="notice.icon" :size="16" />
      <!-- 转圈是纯装饰：状态已经由上面的 aria-label 说过了 -->
      <span v-if="notice.busy" class="i-run-status__spinner" aria-hidden="true" />
    </span>

    <span class="i-run-status__body">
      <span class="i-run-status__label">{{ notice.label }}</span>
      <span v-if="notice.detail" class="i-run-status__detail">{{ notice.detail }}</span>
    </span>

    <span v-if="waited" class="i-run-status__waited">{{ waited }}</span>

    <IButton
      v-if="notice.cancelable"
      class="i-run-status__cancel"
      size="sm"
      @click="emit('cancel')"
    >
      {{ cancelText }}
    </IButton>
  </div>
</template>
