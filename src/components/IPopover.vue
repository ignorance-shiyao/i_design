<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { Placement } from '@i-design/common'
import { arrowStyle, useOverlayPosition } from './overlayPosition'

const props = withDefaults(
  defineProps<{
    title?: string
    content?: string
    placement?: Placement
    /** 点击触发适合承载可交互内容，悬浮适合纯说明 */
    trigger?: 'click' | 'hover'
    disabled?: boolean
    /**
     * 受控开合。不传时组件自己管；传了则以外部为准——
     * Select、Cascader 这类「选完就该收起」的控件需要在选中时主动关闭。
     */
    open?: boolean
    align?: 'center' | 'start'
  }>(),
  {
    title: '',
    content: '',
    placement: 'top',
    trigger: 'click',
    disabled: false,
    open: undefined,
    align: 'center'
  }
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const inner = ref(false)
const controlled = computed(() => props.open !== undefined)
const visible = computed(() => (controlled.value ? !!props.open : inner.value))
function setVisible(next: boolean) {
  if (!controlled.value) inner.value = next
  emit('update:open', next)
}

const triggerEl = ref<HTMLElement>()
const popupEl = ref<HTMLElement>()
const id = `i-popover-${useId()}`
let timer: ReturnType<typeof setTimeout> | undefined

const { pos } = useOverlayPosition(
  triggerEl,
  popupEl,
  visible,
  {
    placement: () => props.placement,
    align: () => props.align,
    // 悬浮触发靠移出关闭，点击触发才需要监听外部点击
    closeOnOutsideClick: props.trigger === 'click'
  },
  () => close()
)

function open() {
  if (props.disabled) return
  clearTimeout(timer)
  setVisible(true)
}

function close() {
  clearTimeout(timer)
  setVisible(false)
}

/*
 * 悬浮触发要留出移动时间：鼠标从触发元素挪到浮层上会经过一段空隙，
 * 立即关闭会让浮层根本点不到。
 */
function delayedClose() {
  if (props.trigger !== 'hover') return
  clearTimeout(timer)
  timer = setTimeout(close, 120)
}

const style = computed(() => ({ left: `${pos.value.x}px`, top: `${pos.value.y}px` }))
</script>

<template>
  <span
    ref="triggerEl"
    class="i-overlay-trigger"
    @click="trigger === 'click' && (visible ? close() : open())"
    @mouseenter="trigger === 'hover' && open()"
    @mouseleave="delayedClose"
    @keydown.escape="close"
  >
    <slot />
  </span>

  <Teleport to="body">
    <Transition name="i-overlay-fade">
      <div
        v-if="visible"
        :id="id"
        ref="popupEl"
        class="i-popover"
        :class="`is-${pos.placement}`"
        :style="style"
        role="dialog"
        :aria-label="title || undefined"
        @mouseenter="trigger === 'hover' && open()"
        @mouseleave="delayedClose"
      >
        <span class="i-popover__arrow" :style="arrowStyle(pos)" />
        <p v-if="title" class="i-popover__title">{{ title }}</p>
        <div class="i-popover__body"><slot name="content">{{ content }}</slot></div>
      </div>
    </Transition>
  </Teleport>
</template>
