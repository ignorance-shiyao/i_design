<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import IIcon from './IIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    placement?: 'right' | 'left' | 'top' | 'bottom'
    /** 横向抽屉的宽度 / 纵向抽屉的高度 */
    size?: string
    maskClosable?: boolean
    closable?: boolean
  }>(),
  {
    modelValue: false,
    title: '',
    placement: 'right',
    size: '380px',
    maskClosable: true,
    closable: true
  }
)

const emit = defineEmits<{ 'update:modelValue': [boolean]; close: [] }>()

const panel = ref<HTMLElement | null>(null)
let lastActive: HTMLElement | null = null

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
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
    <Transition :name="`i-drawer-${placement}`">
      <div v-if="modelValue" class="i-drawer" @click.self="maskClosable && close()">
        <div
          ref="panel"
          class="i-drawer__panel"
          :class="`is-${placement}`"
          :style="
            placement === 'left' || placement === 'right' ? { width: size } : { height: size }
          "
          role="dialog"
          aria-modal="true"
          :aria-label="title || undefined"
          tabindex="-1"
        >
          <header v-if="title || closable" class="i-drawer__header">
            <h3 class="i-drawer__title">{{ title }}</h3>
            <button v-if="closable" class="i-drawer__close" aria-label="关闭" @click="close">
              <IIcon name="close" :size="18" />
            </button>
          </header>
          <div class="i-drawer__body"><slot /></div>
          <footer v-if="$slots.footer" class="i-drawer__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.i-drawer {
  position: fixed;
  inset: 0;
  z-index: var(--i-z-modal);
  background: rgba(20, 24, 34, 0.45);
}
.i-drawer__panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: 100%;
  background: var(--i-color-bg);
  box-shadow: var(--i-shadow-xl);
  outline: none;
}
.i-drawer__panel.is-right { top: 0; bottom: 0; right: 0; }
.i-drawer__panel.is-left { top: 0; bottom: 0; left: 0; }
.i-drawer__panel.is-top { left: 0; right: 0; top: 0; }
.i-drawer__panel.is-bottom { left: 0; right: 0; bottom: 0; }

.i-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-4);
  padding: var(--i-spacing-4) var(--i-spacing-5);
  border-bottom: 1px solid var(--i-color-border);
}
.i-drawer__title { font-size: var(--i-font-size-lg); }
.i-drawer__close {
  display: grid;
  place-items: center;
  padding: var(--i-spacing-1);
  border: none;
  background: none;
  line-height: 1;
  color: var(--i-color-text-tertiary);
  border-radius: var(--i-radius-sm);
  cursor: pointer;
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing);
}
.i-drawer__close:hover { color: var(--i-color-text); }
.i-drawer__body { flex: 1; overflow-y: auto; padding: var(--i-spacing-5); color: var(--i-color-text-secondary); }
.i-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-3) var(--i-spacing-5);
  border-top: 1px solid var(--i-color-border);
}

/* 遮罩淡入，面板从对应边缘滑入 */
.i-drawer-right-enter-active, .i-drawer-right-leave-active,
.i-drawer-left-enter-active, .i-drawer-left-leave-active,
.i-drawer-top-enter-active, .i-drawer-top-leave-active,
.i-drawer-bottom-enter-active, .i-drawer-bottom-leave-active {
  transition: opacity var(--i-motion-base) var(--i-motion-easing);
}
.i-drawer-right-enter-from, .i-drawer-right-leave-to,
.i-drawer-left-enter-from, .i-drawer-left-leave-to,
.i-drawer-top-enter-from, .i-drawer-top-leave-to,
.i-drawer-bottom-enter-from, .i-drawer-bottom-leave-to { opacity: 0; }

.i-drawer-right-enter-active .i-drawer__panel,
.i-drawer-right-leave-active .i-drawer__panel,
.i-drawer-left-enter-active .i-drawer__panel,
.i-drawer-left-leave-active .i-drawer__panel,
.i-drawer-top-enter-active .i-drawer__panel,
.i-drawer-top-leave-active .i-drawer__panel,
.i-drawer-bottom-enter-active .i-drawer__panel,
.i-drawer-bottom-leave-active .i-drawer__panel {
  transition: transform var(--i-motion-slow) var(--i-motion-easing);
}
.i-drawer-right-enter-from .i-drawer__panel,
.i-drawer-right-leave-to .i-drawer__panel { transform: translateX(100%); }
.i-drawer-left-enter-from .i-drawer__panel,
.i-drawer-left-leave-to .i-drawer__panel { transform: translateX(-100%); }
.i-drawer-top-enter-from .i-drawer__panel,
.i-drawer-top-leave-to .i-drawer__panel { transform: translateY(-100%); }
.i-drawer-bottom-enter-from .i-drawer__panel,
.i-drawer-bottom-leave-to .i-drawer__panel { transform: translateY(100%); }
</style>
