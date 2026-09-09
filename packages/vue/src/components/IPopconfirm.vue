<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Placement } from '@i-design/common'
import IButton from './IButton.vue'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'
import { arrowStyle, useOverlayPosition } from './overlayPosition'
import IPortal from './_Portal.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    content?: string
    confirmText?: string
    cancelText?: string
    /** 破坏性操作用 danger，让确认按钮本身说明后果 */
    type?: 'brand' | 'danger'
    placement?: Placement
    icon?: IconName
    disabled?: boolean
  }>(),
  {
    title: '确认执行该操作？',
    content: '',
    confirmText: '确定',
    cancelText: '取消',
    type: 'brand',
    placement: 'top',
    icon: 'help-circle',
    disabled: false
  }
)

const emit = defineEmits<{ confirm: []; cancel: []; 'update:visible': [boolean] }>()

const triggerEl = ref<HTMLElement>()
const panel = ref<HTMLElement>()
const visible = ref(false)

const { pos } = useOverlayPosition(
  triggerEl,
  panel,
  visible,
  { placement: () => props.placement, closeOnOutsideClick: true },
  () => close()
)

async function open() {
  if (props.disabled) return
  visible.value = true
  emit('update:visible', true)
  await nextTick()
  // 焦点移入气泡，Esc 与 Tab 才有意义
  panel.value?.querySelector<HTMLElement>('button')?.focus()
}

function close() {
  if (!visible.value) return
  visible.value = false
  emit('update:visible', false)
  // 焦点交还触发元素，否则关闭后键盘用户会失去位置
  triggerEl.value?.querySelector<HTMLElement>('button, [tabindex]:not([tabindex="-1"])')?.focus()
}

function onConfirm() {
  emit('confirm')
  close()
}

function onCancel() {
  emit('cancel')
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && visible.value) close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

const style = computed(() => ({ left: `${pos.value.x}px`, top: `${pos.value.y}px` }))
</script>

<template>
  <span ref="triggerEl" class="i-popconfirm">
    <span class="i-popconfirm__trigger" @click="visible ? close() : open()"><slot /></span>
  </span>

  <IPortal>
    <Transition name="i-popconfirm-fade">
      <div
        v-if="visible"
        ref="panel"
        class="i-popconfirm__panel"
        :class="`is-${pos.placement}`"
        :style="style"
        role="dialog"
        :aria-label="title"
      >
        <span class="i-popconfirm__arrow" :style="arrowStyle(pos)" />
        <div class="i-popconfirm__head">
          <IIcon class="i-popconfirm__icon" :class="`is-${type}`" :name="icon" :size="17" />
          <div>
            <p class="i-popconfirm__title">{{ title }}</p>
            <p v-if="content" class="i-popconfirm__content">{{ content }}</p>
          </div>
        </div>
        <div class="i-popconfirm__foot">
          <IButton size="sm" @click="onCancel">{{ cancelText }}</IButton>
          <IButton size="sm" :variant="type === 'danger' ? 'danger' : 'primary'" @click="onConfirm">
            {{ confirmText }}
          </IButton>
        </div>
      </div>
    </Transition>
  </IPortal>
</template>
