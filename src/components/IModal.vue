<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    width?: string
    /** 点击遮罩是否关闭；破坏性确认场景建议关闭此项 */
    maskClosable?: boolean
    closable?: boolean
  }>(),
  { modelValue: false, title: '', width: '480px', maskClosable: true, closable: true }
)

const emit = defineEmits<{ 'update:modelValue': [boolean]; close: [] }>()

const panel = ref<HTMLElement | null>(null)
let lastActive: HTMLElement | null = null

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onMaskClick() {
  if (props.maskClosable) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      // 记住触发元素，关闭后把焦点还回去，避免焦点掉到 body
      lastActive = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
      await nextTick()
      panel.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
      lastActive?.focus()
    }
  }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="i-modal">
      <div v-if="modelValue" class="i-modal" @click.self="onMaskClick">
        <div
          ref="panel"
          class="i-modal__panel"
          :style="{ width }"
          role="dialog"
          aria-modal="true"
          :aria-label="title || undefined"
          tabindex="-1"
        >
          <header v-if="title || closable" class="i-modal__header">
            <h3 class="i-modal__title">{{ title }}</h3>
            <button v-if="closable" class="i-modal__close" aria-label="关闭" @click="close">×</button>
          </header>
          <div class="i-modal__body"><slot /></div>
          <footer v-if="$slots.footer" class="i-modal__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.i-modal {
  position: fixed;
  inset: 0;
  z-index: var(--i-z-modal);
  display: grid;
  place-items: center;
  padding: var(--i-spacing-6);
  background: rgba(20, 24, 34, 0.45);
}
.i-modal__panel {
  max-width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--i-color-bg);
  border-radius: var(--i-radius-lg);
  box-shadow: var(--i-shadow-xl);
  outline: none;
}
.i-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-4);
  padding: var(--i-spacing-4) var(--i-spacing-5);
  border-bottom: 1px solid var(--i-color-border);
}
.i-modal__title { font-size: var(--i-font-size-lg); }
.i-modal__close {
  border: none;
  background: none;
  font-size: var(--i-font-size-xl);
  line-height: 1;
  color: var(--i-color-text-tertiary);
  cursor: pointer;
}
.i-modal__close:hover { color: var(--i-color-text); }
.i-modal__body {
  padding: var(--i-spacing-5);
  overflow-y: auto;
  color: var(--i-color-text-secondary);
}
.i-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-3) var(--i-spacing-5);
  border-top: 1px solid var(--i-color-border);
}

.i-modal-enter-active,
.i-modal-leave-active { transition: opacity var(--i-motion-base) var(--i-motion-easing); }
.i-modal-enter-from,
.i-modal-leave-to { opacity: 0; }
.i-modal-enter-active .i-modal__panel,
.i-modal-leave-active .i-modal__panel {
  transition: transform var(--i-motion-base) var(--i-motion-easing);
}
.i-modal-enter-from .i-modal__panel,
.i-modal-leave-to .i-modal__panel { transform: translateY(-8px) scale(0.98); }
</style>
