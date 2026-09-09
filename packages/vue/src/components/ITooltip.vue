<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    /** 悬浮多久后出现，避免鼠标划过一排按钮时连续闪烁 */
    delay?: number
    disabled?: boolean
  }>(),
  { content: '', placement: 'top', delay: 100, disabled: false }
)

// Vue 2.7 没有 useId
let seed = 0
const id = `i-tooltip-${++seed}-${Math.random().toString(36).slice(2, 7)}`

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function show() {
  if (props.disabled) return
  clearTimeout(timer)
  timer = setTimeout(() => (visible.value = true), props.delay)
}

function hide() {
  clearTimeout(timer)
  visible.value = false
}
</script>

<template>
  <span
    class="i-tooltip"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
    @keydown.esc="hide"
  >
    <span class="i-tooltip__trigger" :aria-describedby="visible ? id : undefined"><slot /></span>
    <transition name="i-tooltip-fade">
      <span
        v-if="visible && (content || $slots.content)"
        :id="id"
        class="i-tooltip__pop"
        :class="`is-${placement}`"
        role="tooltip"
      >
        <slot name="content">{{ content }}</slot>
      </span>
    </transition>
  </span>
</template>
