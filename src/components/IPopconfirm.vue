<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import IButton from './IButton.vue'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{
    title?: string
    content?: string
    confirmText?: string
    cancelText?: string
    /** 破坏性操作用 danger，让确认按钮本身说明后果 */
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

const emit = defineEmits<{ confirm: []; cancel: []; 'update:visible': [boolean] }>()

const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const visible = ref(false)

async function open() {
  if (props.disabled) return
  visible.value = true
  emit('update:visible', true)
  await nextTick()
  // 焦点移入气泡，Esc 与 Tab 才有意义
  panel.value?.querySelector<HTMLElement>('button')?.focus()
}

function close() {
  visible.value = false
  emit('update:visible', false)
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

    <Transition name="i-popconfirm-fade">
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
    </Transition>
  </span>
</template>

<style scoped>
.i-popconfirm { position: relative; display: inline-flex; }
.i-popconfirm__trigger { display: inline-flex; }

.i-popconfirm__panel {
  position: absolute;
  z-index: var(--i-z-dropdown);
  width: 260px;
  padding: var(--i-spacing-4);
  background: var(--i-color-bg-elevated);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  box-shadow: var(--i-shadow-lg);
  text-align: left;
}
.is-top { bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); }
.is-bottom { top: calc(100% + 8px); left: 50%; transform: translateX(-50%); }
.is-left { right: calc(100% + 8px); top: 50%; transform: translateY(-50%); }
.is-right { left: calc(100% + 8px); top: 50%; transform: translateY(-50%); }

.i-popconfirm__head { display: flex; gap: var(--i-spacing-2); }
.i-popconfirm__icon { margin-top: 2px; }
.i-popconfirm__icon.is-brand { color: var(--i-color-brand); }
.i-popconfirm__icon.is-danger { color: var(--i-color-danger); }
.i-popconfirm__title { font-size: var(--i-font-size-md); font-weight: 500; color: var(--i-color-text); }
.i-popconfirm__content {
  margin-top: var(--i-spacing-1);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
.i-popconfirm__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--i-spacing-2);
  margin-top: var(--i-spacing-4);
}

.i-popconfirm-fade-enter-active,
.i-popconfirm-fade-leave-active { transition: opacity var(--i-motion-fast) var(--i-motion-easing); }
.i-popconfirm-fade-enter-from,
.i-popconfirm-fade-leave-to { opacity: 0; }
</style>
