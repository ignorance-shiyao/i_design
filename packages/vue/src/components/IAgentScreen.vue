<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IAgentScreen.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 智能体屏幕：看着智能体操作一块屏幕。
 *
 * 这件事有一个不明显的难点：**一张静止的画面，看起来和一张卡住的画面
 * 一模一样。** 智能体在想事情、网络断了、进程挂了——三种情况下画面都不动，
 * 而用户只能干等。所以这个组件真正花力气的地方不是画面本身，
 * 是围着画面的那几行字：现在在做什么、画面是什么时候的、还能不能插手。
 *
 * 画面框的高宽比在第一帧之前就定下来，否则连上的那一刻整页会跳一下，
 * 而那一刻用户正盯着这里看。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import IIcon from './IIcon.vue'
import ILoading from './ILoading.vue'
import {
  canTakeOver,
  frameAge,
  frameStale,
  frameStaleText,
  screenAspect,
  screenStatusIcon,
  screenStatusText,
  type AgentScreenState
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    state?: AgentScreenState
    /** 当前在做什么。有它就显示它——「工作中」三个字没有信息量 */
    action?: string
    /** 当前画面的图片地址。没有时显示占位，框的大小不变 */
    frame?: string
    /** 画面的时间戳（毫秒）。用来算「画面几秒前」 */
    updatedAt?: number
    /** 画面原始尺寸，用来定高宽比 */
    frameWidth?: number
    frameHeight?: number
    title?: string
  }>(),
  { state: 'connecting', action: '', frame: '', updatedAt: 0, title: '智能体屏幕' }
)

const emit = defineEmits<{ (e: 'takeover'): void }>()

/* 自己走一个秒表：画面的时间戳不变，但「几秒前」得一直往前走 */
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const status = computed(() => screenStatusText(props.state, props.action))
const age = computed(() => (props.updatedAt ? frameAge(now.value, props.updatedAt) : ''))
const stale = computed(() =>
  props.updatedAt ? frameStale(now.value, props.updatedAt, props.state) : false
)
/* 「多久没动」与「什么时候的」是两句话：混用会写出「已经 44 秒前没动了」 */
const staleText = computed(() => frameStaleText(now.value, props.updatedAt))
const aspect = computed(() => screenAspect(props.frameWidth, props.frameHeight))
</script>

<template>
  <section class="i-screen" :class="`i-screen--${state}`">
    <header class="i-screen__head">
      <span class="i-screen__status">
        <!-- 连接中与操作中用转圈，其余用图标：转圈本身就说明「还在动」 -->
        <ILoading v-if="state === 'connecting' || state === 'working'" size="sm" />
        <IIcon v-else :name="screenStatusIcon(state)" :size="14" />
        {{ status }}
      </span>
      <!--
        画面的时间戳是这里最要紧的一行字：不写出来，用户会把一次卡死
        当成智能体在思考，白等好几分钟。
      -->
      <span v-if="age" class="i-screen__age" :class="{ 'is-stale': stale }">
        <IIcon v-if="stale" name="warning-triangle" :size="12" />
        {{ age }}
      </span>
      <button
        class="i-screen__takeover"
        type="button"
        :disabled="!canTakeOver(state)"
        @click="emit('takeover')"
      >
        <IIcon name="user" :size="13" />
        接管
      </button>
    </header>

    <div class="i-screen__frame" :style="{ aspectRatio: aspect }">
      <img v-if="frame" class="i-screen__img" :src="frame" :alt="`${title}：${status}`" />
      <!-- 没有画面时占位，框的大小不变——大小一变，连上的那一刻整页就跳了 -->
      <div v-else class="i-screen__placeholder">
        <ILoading v-if="state === 'connecting'" size="md" />
        <IIcon v-else :name="screenStatusIcon(state)" :size="20" />
        <span>{{ status }}</span>
      </div>

      <!-- 卡住的提醒压在画面上，而不是挤在头部：用户此刻正看着画面 -->
      <p v-if="stale" class="i-screen__stale">
        <IIcon name="warning-triangle" :size="14" />
        {{ staleText }}
      </p>
    </div>
  </section>
</template>
