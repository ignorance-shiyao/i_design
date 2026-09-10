<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ILoading from './ILoading.vue'
import { loadHint, shouldLoadMore, type LoadStatus } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    status?: LoadStatus
    /** 距底多少像素开始加载 */
    threshold?: number
    /** 容器高度；不传就跟随外层，由页面自己滚动 */
    height?: number
    /** 一条都没有时，「没有更多了」要换成「暂无内容」 */
    empty?: boolean
  }>(),
  { status: 'idle', threshold: 120, height: 0, empty: false }
)

const emit = defineEmits<{ load: []; retry: [] }>()

const root = ref<HTMLElement | null>(null)

function check() {
  const el = root.value
  if (!el) return
  // 自己滚动时量自己，跟随页面滚动时量视口
  const metrics = props.height
    ? { scrollTop: el.scrollTop, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight }
    : {
        scrollTop: window.scrollY,
        clientHeight: window.innerHeight,
        scrollHeight: el.getBoundingClientRect().bottom + window.scrollY
      }
  if (shouldLoadMore(metrics, props.status, props.threshold)) emit('load')
}

/*
 * 内容变了也要复查一次：加载回来的一页如果还是没撑满容器，
 * 就没有滚动条，用户再怎么划也到不了底，列表会永远停在这一页。
 * 这是无限滚动最常见的死局，而它只在「窗口很高」或「每页很少」时才暴露。
 */
let observer: ResizeObserver | null = null

onMounted(() => {
  const target = props.height ? root.value : window
  target?.addEventListener('scroll', check, { passive: true })
  window.addEventListener('resize', check, { passive: true })
  observer = new ResizeObserver(check)
  if (root.value) observer.observe(root.value)
  check()
})

onBeforeUnmount(() => {
  const target = props.height ? root.value : window
  target?.removeEventListener('scroll', check)
  window.removeEventListener('resize', check)
  observer?.disconnect()
})

watch(() => props.status, check)

const hint = computed(() => loadHint(props.status, props.empty))
</script>

<template>
  <div
    ref="root"
    class="i-infinite"
    :class="{ 'is-scroller': !!height }"
    :style="height ? { height: `${height}px` } : undefined"
  >
    <slot />

    <!--
      状态区一直占位，而不是加载时才插进来：
      插进来会把列表往上顶一下，用户正在读的那一行会跳走。
      aria-live 让读屏在这里播报进度，否则「加载中」对他们完全不存在。
    -->
    <div class="i-infinite__foot" aria-live="polite">
      <ILoading v-if="status === 'loading'" size="sm" :text="hint" />
      <button v-else-if="status === 'error'" class="i-infinite__retry" @click="emit('retry')">
        {{ hint }}
      </button>
      <span v-else-if="status === 'finished'" class="i-infinite__done">{{ hint }}</span>
    </div>
  </div>
</template>
