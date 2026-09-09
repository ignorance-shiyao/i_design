<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import IPortal from './_Portal.vue'

const props = withDefaults(
  defineProps<{
    /** Vue 2 的 v-model 走 value / input */
    value?: boolean
    title?: string
    width?: string
    maskClosable?: boolean
    closable?: boolean
  }>(),
  { value: false, title: '', width: '480px', maskClosable: true, closable: true }
)

const emit = defineEmits<{ (e: 'input', value: boolean): void; (e: 'close'): void }>()

const panel = ref<HTMLElement | null>(null)
let lastActive: HTMLElement | null = null

function close() {
  emit('input', false)
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.value,
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
  <IPortal>
    <transition name="i-modal">
      <div v-if="value" class="i-modal" @click.self="maskClosable && close()">
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
            <button v-if="closable" class="i-modal__close" aria-label="关闭" @click="close">
              <IIcon name="close" :size="18" />
            </button>
          </header>
          <div class="i-modal__body"><slot /></div>
          <footer v-if="$slots.footer" class="i-modal__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </transition>
  </IPortal>
</template>
