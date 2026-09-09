<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { Placement } from '@i-design/common'
import { arrowStyle, useOverlayPosition } from './overlayPosition'

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: Placement
    /** 悬浮多久后出现，避免鼠标划过时闪烁 */
    delay?: number
    disabled?: boolean
  }>(),
  { content: '', placement: 'top', delay: 100, disabled: false }
)

const visible = ref(false)
const triggerEl = ref<HTMLElement>()
const popupEl = ref<HTMLElement>()
const id = `i-tooltip-${useId()}`
let timer: ReturnType<typeof setTimeout> | undefined

// 提示不需要点击外部关闭：它靠移出触发元素消失
const { pos } = useOverlayPosition(triggerEl, popupEl, visible, {
  placement: () => props.placement,
  offset: 6
})

function show() {
  if (props.disabled) return
  clearTimeout(timer)
  timer = setTimeout(() => (visible.value = true), props.delay)
}

function hide() {
  clearTimeout(timer)
  visible.value = false
}

const style = computed(() => ({ left: `${pos.value.x}px`, top: `${pos.value.y}px` }))
</script>

<template>
  <span
    ref="triggerEl"
    class="i-tooltip"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
    @keydown.escape="hide"
  >
    <span class="i-tooltip__trigger" :aria-describedby="visible ? id : undefined"><slot /></span>
  </span>

  <Teleport to="body">
    <Transition name="i-tooltip-fade">
      <span
        v-if="visible && (content || $slots.content)"
        :id="id"
        ref="popupEl"
        class="i-tooltip__pop"
        :class="`is-${pos.placement}`"
        :style="style"
        role="tooltip"
      >
        <span class="i-tooltip__arrow" :style="arrowStyle(pos)" />
        <slot name="content">{{ content }}</slot>
      </span>
    </Transition>
  </Teleport>
</template>
