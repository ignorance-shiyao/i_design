<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import IButton from './IButton.vue'
import IIcon from './IIcon.vue'
import type { IconName } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    title?: string
    content?: string
    confirmText?: string
    cancelText?: string
    type?: 'brand' | 'danger'
    placement?: 'top' | 'bottom' | 'left' | 'right'
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

const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()

const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const visible = ref(false)

async function open() {
  if (props.disabled) return
  visible.value = true
  await nextTick()
  // 焦点移入气泡，Esc 与 Tab 才有意义
  panel.value?.querySelector<HTMLElement>('button')?.focus()
}

function close() {
  visible.value = false
}

function onConfirm() {
  emit('confirm')
  close()
}

function onCancel() {
  emit('cancel')
  close()
}

function onClickOutside(event: MouseEvent) {
  if (visible.value && root.value && !root.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && visible.value) close()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <span ref="root" class="i-popconfirm">
    <span class="i-popconfirm__trigger" @click="visible ? close() : open()"><slot /></span>

    <transition name="i-popconfirm-fade">
      <div
        v-if="visible"
        ref="panel"
        class="i-popconfirm__panel"
        :class="`is-${placement}`"
        role="dialog"
        :aria-label="title"
      >
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
    </transition>
  </span>
</template>
