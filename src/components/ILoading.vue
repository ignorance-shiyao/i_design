<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useConfig } from './useConfig'
import { elapsedInterval, elapsedParts, shouldShowElapsed } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 包裹内容时作为区域遮罩；无内容时作为独立指示器 */
    loading?: boolean
    text?: string
    size?: 'sm' | 'md' | 'lg'
    /** 遮罩是否覆盖整个父容器（父容器需为定位上下文） */
    fullscreen?: boolean
    /**
     * 显示已等待时长。
     *
     * 智能体的一次调用动辄十几秒，只转圈不给数字的话，三秒和三十秒看起来一样，
     * 于是有人反复点，或者以为卡死了刷新页面——前一次的结果就此丢掉。
     */
    elapsed?: boolean
  }>(),
  { loading: true, text: '', size: 'md', fullscreen: false, elapsed: false }
)

const { locale } = useConfig()
/* 传了就用传的，没传才回落到字典。读屏用户听到的就是这一句 */
const label = computed(() => props.text || locale.value.loading)

/*
 * 计时从「开始加载」那一刻算起，按目标时刻反算而不是累加间隔：
 * 页面切到后台时定时器会被节流，累加的写法回到前台一看会明显偏慢。
 */
const since = ref(0)
const now = ref(0)
let timer: ReturnType<typeof setTimeout> | null = null

function stop() {
  if (timer) clearTimeout(timer)
  timer = null
}

function tick() {
  now.value = Date.now()
  timer = setTimeout(tick, elapsedInterval(now.value - since.value))
}

watch(
  () => props.loading && props.elapsed,
  (on) => {
    stop()
    if (!on) return
    since.value = Date.now()
    now.value = since.value
    tick()
  },
  { immediate: true }
)
onBeforeUnmount(stop)

const waited = computed(() => now.value - since.value)
const elapsedText = computed(() => {
  if (!props.elapsed || !shouldShowElapsed(waited.value)) return ''
  const { minutes, seconds } = elapsedParts(waited.value)
  const s = `${seconds}${locale.value.secondUnit}`
  return minutes ? `${minutes}${locale.value.minuteUnit} ${s}` : s
})
</script>

<template>
  <div v-if="$slots.default" class="i-loading-wrap">
    <slot />
    <div v-if="loading" class="i-loading-mask" :class="{ 'is-fullscreen': fullscreen }">
      <span class="i-loading" :class="`i-loading--${size}`" role="status" :aria-label="label">
        <span class="i-loading__spinner" />
        <span v-if="text" class="i-loading__text">{{ text }}</span>
        <span v-if="elapsedText" class="i-loading__elapsed">{{ elapsedText }}</span>
      </span>
    </div>
  </div>
  <span
    v-else-if="loading"
    class="i-loading"
    :class="`i-loading--${size}`"
    role="status"
    :aria-label="label"
  >
    <span class="i-loading__spinner" />
    <span v-if="text" class="i-loading__text">{{ text }}</span>
    <span v-if="elapsedText" class="i-loading__elapsed">{{ elapsedText }}</span>
  </span>
</template>
