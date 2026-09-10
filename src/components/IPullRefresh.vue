<script setup lang="ts">
import { computed, ref } from 'vue'
import ILoading from './ILoading.vue'
import IIcon from './IIcon.vue'
import {
  PULL_MAX,
  PULL_THRESHOLD,
  pullDistance,
  pullHint,
  pullStatus,
  refreshingOffset,
  shouldRefresh,
  type PullStatus
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 拉到这里松手才刷新 */
    threshold?: number
    /** 最多能拉这么远 */
    max?: number
    /** 高度；不传则跟随外层 */
    height?: number
    disabled?: boolean
  }>(),
  { threshold: PULL_THRESHOLD, max: PULL_MAX, height: 0, disabled: false }
)

const emit = defineEmits<{ refresh: [] }>()

const scroller = ref<HTMLElement | null>(null)
const distance = ref(0)
const status = ref<PullStatus>('idle')
let startY = 0
let pulling = false

/*
 * 只在列表已经滚到顶部时才接管手势。
 *
 * 不判断的话，用户在列表中间往下滑，滑动会被下拉刷新吃掉——
 * 列表不动，顶上却冒出个「下拉可以刷新」，看起来像卡住了。
 */
function onStart(event: TouchEvent) {
  if (props.disabled || status.value === 'refreshing') return
  const el = scroller.value
  if (!el || el.scrollTop > 0) return
  pulling = true
  startY = event.touches[0].clientY
}

function onMove(event: TouchEvent) {
  if (!pulling) return
  const delta = event.touches[0].clientY - startY
  if (delta <= 0) {
    // 反向滑动交还给列表：这时用户是想往下看，不是想刷新
    distance.value = 0
    status.value = 'idle'
    pulling = false
    return
  }
  // 手势接管之后要阻止页面滚动，否则整页会跟着一起动
  event.preventDefault()
  distance.value = pullDistance(delta, props.max)
  status.value = pullStatus(distance.value, props.threshold)
}

async function onEnd() {
  if (!pulling) return
  pulling = false
  if (!shouldRefresh(distance.value, props.threshold)) {
    distance.value = 0
    status.value = 'idle'
    return
  }
  // 停在阈值处而不是收回零：收回零的话指示器立刻消失，用户会再拉一次
  distance.value = refreshingOffset(props.threshold)
  status.value = 'refreshing'
  emit('refresh')
}

/** 由调用方在数据到位后调用；组件不猜什么时候算刷新完了 */
function finish() {
  status.value = 'done'
  setTimeout(() => {
    distance.value = 0
    status.value = 'idle'
  }, 300)
}

defineExpose({ finish })

const hint = computed(() => pullHint(status.value))
const style = computed(() => ({
  transform: `translateY(${distance.value}px)`,
  // 拖动中不做过渡，松手回弹才做：带着过渡拖，手感是黏的
  transition: pulling ? 'none' : 'transform var(--i-motion-base) var(--i-motion-easing-out)'
}))
</script>

<template>
  <div
    ref="scroller"
    class="i-pull"
    :style="height ? { height: `${height}px` } : undefined"
    @touchstart.passive="onStart"
    @touchmove="onMove"
    @touchend="onEnd"
    @touchcancel="onEnd"
  >
    <div class="i-pull__body" :style="style">
      <!--
        提示区挂在内容上方、靠位移露出来，而不是插进文档流。
        插进来的话，刷新开始那一刻列表会整块往下跳一次。
        aria-live 让读屏跟得上：「正在刷新」对他们否则完全不存在。
      -->
      <div class="i-pull__head" :style="{ height: `${threshold}px`, marginTop: `-${threshold}px` }" aria-live="polite">
        <ILoading v-if="status === 'refreshing'" size="sm" :text="hint" />
        <span v-else-if="hint" class="i-pull__hint">
          <IIcon name="arrow-right" :size="14" :class="{ 'is-flipped': status === 'ready' }" />
          {{ hint }}
        </span>
      </div>
      <slot />
    </div>
  </div>
</template>
