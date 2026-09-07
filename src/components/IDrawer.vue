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
