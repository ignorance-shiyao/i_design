<script setup lang="ts">
import { ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    /** 悬浮多久后出现，避免鼠标划过时闪烁 */
    delay?: number
    disabled?: boolean
  }>(),
  { content: '', placement: 'top', delay: 100, disabled: false }
)

const visible = ref(false)
const id = `i-tooltip-${useId()}`
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
    @keydown.escape="hide"
  >
    <span class="i-tooltip__trigger" :aria-describedby="visible ? id : undefined"><slot /></span>
    <Transition name="i-tooltip-fade">
      <span v-if="visible && (content || $slots.content)" :id="id" class="i-tooltip__pop" :class="`is-${placement}`" role="tooltip">
        <slot name="content">{{ content }}</slot>
      </span>
    </Transition>
  </span>
</template>

<style scoped>
.i-tooltip { position: relative; display: inline-flex; }
.i-tooltip__trigger { display: inline-flex; }

.i-tooltip__pop {
  position: absolute;
  z-index: var(--i-z-dropdown);
  max-width: 260px;
  width: max-content;
  padding: var(--i-spacing-2) var(--i-spacing-3);
  font-size: var(--i-font-size-sm);
  line-height: var(--i-line-height-base);
  color: var(--i-color-text-inverse);
  background: var(--i-color-bg-inverse);
  border-radius: var(--i-radius-md);
  box-shadow: var(--i-shadow-md);
  pointer-events: none;
}
.i-tooltip__pop::after {
  content: '';
  position: absolute;
  border: 5px solid transparent;
}
.is-top { bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); }
.is-top::after { top: 100%; left: 50%; margin-left: -5px; border-top-color: var(--i-color-bg-inverse); }
.is-bottom { top: calc(100% + 6px); left: 50%; transform: translateX(-50%); }
.is-bottom::after { bottom: 100%; left: 50%; margin-left: -5px; border-bottom-color: var(--i-color-bg-inverse); }
.is-left { right: calc(100% + 6px); top: 50%; transform: translateY(-50%); }
.is-left::after { left: 100%; top: 50%; margin-top: -5px; border-left-color: var(--i-color-bg-inverse); }
.is-right { left: calc(100% + 6px); top: 50%; transform: translateY(-50%); }
.is-right::after { right: 100%; top: 50%; margin-top: -5px; border-right-color: var(--i-color-bg-inverse); }

.i-tooltip-fade-enter-active,
.i-tooltip-fade-leave-active { transition: opacity var(--i-motion-fast) var(--i-motion-easing); }
.i-tooltip-fade-enter-from,
.i-tooltip-fade-leave-to { opacity: 0; }
</style>
