<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import IIcon from './IIcon.vue'

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
            <button v-if="closable" class="i-modal__close" aria-label="关闭" @click="close">
              <IIcon name="close" :size="18" />
            </button>
          </header>
          <div class="i-modal__body"><slot /></div>
          <footer v-if="$slots.footer" class="i-modal__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
