<script setup lang="ts">
import { computed, ref } from 'vue'

export interface SwipeAction {
  text: string
  /** danger 用于删除这类不可逆操作 */
  type?: 'default' | 'brand' | 'danger'
}

const props = withDefaults(
  defineProps<{ actions: SwipeAction[]; disabled?: boolean }>(),
  { disabled: false }
)

const emit = defineEmits<{ action: [SwipeAction, number] }>()

const offset = ref(0)
const dragging = ref(false)
let startX = 0
let startOffset = 0

// 操作区总宽度：每个按钮 72px，滑动最多露出这么多
const maxOffset = computed(() => props.actions.length * 72)

function onStart(event: PointerEvent) {
  if (props.disabled) return
  dragging.value = true
  startX = event.clientX
  startOffset = offset.value
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
}

function onMove(event: PointerEvent) {
  if (!dragging.value) return
  const delta = event.clientX - startX
  // 只允许左滑露出操作，右滑到 0 为止；再往右拉是空的，没有意义
  offset.value = Math.min(0, Math.max(-maxOffset.value, startOffset + delta))
}

function onEnd() {
  if (!dragging.value) return
  dragging.value = false
  // 松手后吸附：过半就完全展开，否则收回——停在中间会让用户以为卡住了
  offset.value = offset.value < -maxOffset.value / 2 ? -maxOffset.value : 0
}

function run(action: SwipeAction, index: number) {
  offset.value = 0
  emit('action', action, index)
}

defineExpose({ close: () => (offset.value = 0) })
</script>

<template>
  <div class="i-swipe-cell" :class="{ 'is-dragging': dragging }">
    <div class="i-swipe-cell__actions">
      <button
        v-for="(action, index) in actions"
        :key="action.text"
        class="i-swipe-cell__action"
        :class="action.type && action.type !== 'default' ? `i-swipe-cell__action--${action.type}` : ''"
        @click="run(action, index)"
      >
        {{ action.text }}
      </button>
    </div>

    <div
      class="i-swipe-cell__content"
      :style="{ transform: `translateX(${offset}px)` }"
      @pointerdown="onStart"
      @pointermove="onMove"
      @pointerup="onEnd"
      @pointercancel="onEnd"
    >
      <slot />
    </div>
  </div>
</template>
