<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from './_Icon.vue'
import {
  PULL_LOADING_HEIGHT,
  pullDistance,
  pullRelease,
  pullRotate,
  pullState
} from '@i-design/common'

/**
 * 下拉刷新。
 *
 * 阻尼、阈值、松手后停在哪都在 logic/pull——各端各写一遍的结果是
 * 同一个手势在一端刷得动、在另一端刷不动。
 */
const props = withDefaults(
  defineProps<{
    /** 由调用方持有：刷新是异步的，什么时候算完只有它知道 */
    refreshing: boolean
    /** 各状态的文案，方便按业务口径改写 */
    texts?: { pulling: string; ready: string; refreshing: string }
  }>(),
  {
    texts: () => ({ pulling: '下拉刷新', ready: '松手即可刷新', refreshing: '正在刷新' })
  }
)

const emit = defineEmits<{ refresh: [] }>()

const distance = ref(0)
const settling = ref(false)
let startY = 0
let pulling = false

const offset = computed(() => (props.refreshing ? PULL_LOADING_HEIGHT : distance.value))
const state = computed(() => pullState(distance.value, props.refreshing))
const text = computed(() =>
  state.value === 'refreshing'
    ? props.texts.refreshing
    : state.value === 'ready'
      ? props.texts.ready
      : props.texts.pulling
)

function onStart(event: TouchEvent) {
  // 只在真正到顶时接管手势：中途接管会把正常的向上滚动也吃掉
  const el = event.currentTarget as HTMLElement
  if (props.refreshing || el.scrollTop > 0) return
  pulling = true
  settling.value = false
  startY = event.touches[0].clientY
}

function onMove(event: TouchEvent) {
  if (!pulling) return
  const delta = event.touches[0].clientY - startY
  if (delta <= 0) {
    distance.value = 0
    return
  }
  distance.value = pullDistance(delta)
}

function onEnd() {
  if (!pulling) return
  pulling = false
  settling.value = true
  const rest = pullRelease(distance.value)
  distance.value = 0
  if (rest > 0) emit('refresh')
}
</script>

<template>
  <div
    class="i-pull-refresh"
    @touchstart.passive="onStart"
    @touchmove.passive="onMove"
    @touchend="onEnd"
    @touchcancel="onEnd"
  >
    <div
      class="i-pull-refresh__body"
      :class="{ 'is-settling': settling }"
      :style="{ transform: `translateY(${offset}px)` }"
    >
      <div class="i-pull-refresh__indicator" role="status" aria-live="polite">
        <!-- 箭头随下拉进度转，到阈值正好 180°——这本身就是「可以松手了」的提示，
             不必只靠文案 -->
        <span
          class="i-pull-refresh__arrow"
          :style="
            state === 'refreshing'
              ? undefined
              : {
                  transform: `rotate(${90 + pullRotate(distance)}deg)`,
                  display: 'inline-flex'
                }
          "
        >
          <IIcon
            :name="state === 'refreshing' ? 'refresh' : 'arrow-right'"
            :size="16"
            :spin="state === 'refreshing'"
          />
        </span>
        {{ text }}
      </div>

      <slot />
    </div>
  </div>
</template>
