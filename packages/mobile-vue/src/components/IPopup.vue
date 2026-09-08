<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 从哪一侧滑出 */
    placement?: 'bottom' | 'top' | 'left' | 'right' | 'center'
    /** 点遮罩关闭 */
    maskClosable?: boolean
    /** 顶部的拖拽提示条，告诉用户这层可以关掉 */
    handle?: boolean
    /** 底部弹层的高度上限，避免顶到状态栏 */
    maxHeight?: string
  }>(),
  { placement: 'bottom', maskClosable: true, handle: true, maxHeight: '80%' }
)

const emit = defineEmits<{ 'update:modelValue': [boolean]; close: [] }>()

function close() {
  emit('update:modelValue', false)
  emit('close')
}

// 打开时锁住背景滚动：手指划在弹层之外会带着底下的页面一起动
watch(
  () => props.modelValue,
  (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition :name="`i-popup-${placement}`">
      <div v-if="modelValue" class="i-popup" :class="`i-popup--${placement}`" role="dialog" aria-modal="true">
        <div class="i-popup__mask" @click="maskClosable && close()" />
        <div class="i-popup__panel" :style="{ maxHeight: placement === 'bottom' || placement === 'top' ? maxHeight : undefined }">
          <span v-if="handle && (placement === 'bottom' || placement === 'top')" class="i-popup__handle" />
          <div class="i-popup__body"><slot /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* 各方向的进出动画：从哪来回哪去，用户才知道这层去了哪里 */
.i-popup-bottom-enter-active .i-popup__panel,
.i-popup-bottom-leave-active .i-popup__panel,
.i-popup-top-enter-active .i-popup__panel,
.i-popup-top-leave-active .i-popup__panel,
.i-popup-left-enter-active .i-popup__panel,
.i-popup-left-leave-active .i-popup__panel,
.i-popup-right-enter-active .i-popup__panel,
.i-popup-right-leave-active .i-popup__panel {
  transition: transform var(--i-motion-base) var(--i-motion-easing);
}
.i-popup-bottom-enter-from .i-popup__panel,
.i-popup-bottom-leave-to .i-popup__panel { transform: translateY(100%); }
.i-popup-top-enter-from .i-popup__panel,
.i-popup-top-leave-to .i-popup__panel { transform: translateY(-100%); }
.i-popup-left-enter-from .i-popup__panel,
.i-popup-left-leave-to .i-popup__panel { transform: translateX(-100%); }
.i-popup-right-enter-from .i-popup__panel,
.i-popup-right-leave-to .i-popup__panel { transform: translateX(100%); }
.i-popup-center-enter-active .i-popup__panel,
.i-popup-center-leave-active .i-popup__panel {
  transition: opacity var(--i-motion-base) var(--i-motion-easing),
    transform var(--i-motion-base) var(--i-motion-easing);
}
.i-popup-center-enter-from .i-popup__panel,
.i-popup-center-leave-to .i-popup__panel { opacity: 0; transform: translate(-50%, -50%) scale(0.94); }

[class*='i-popup-'][class*='-enter-active'] .i-popup__mask,
[class*='i-popup-'][class*='-leave-active'] .i-popup__mask {
  transition: opacity var(--i-motion-base) var(--i-motion-easing);
}
[class*='i-popup-'][class*='-enter-from'] .i-popup__mask,
[class*='i-popup-'][class*='-leave-to'] .i-popup__mask { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .i-popup__panel,
  .i-popup__mask { transition: none !important; }
}
</style>
