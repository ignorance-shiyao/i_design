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
let wasOpen = false

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
      // 没打开过就什么都不用收：immediate 会让每个挂载中的 Modal 都跑一次这里，
      // 照做的话，一个刚挂载的关闭态 Modal 会把另一个已打开的锁的滚动解开
      if (!wasOpen) return
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
      lastActive?.focus()
    }
    wasOpen = open
  },
  /*
   * immediate：命令式对话框是「挂载时就已经是打开的」，modelValue 从头到尾都是 true，
   * 不带 immediate 的话这段根本不跑——Esc 关不掉、背景照样能滚、焦点也不进面板。
   * 页面里 v-model 切换的用法看不出这个差别，所以它能一直藏着。
   */
  { immediate: true }
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
