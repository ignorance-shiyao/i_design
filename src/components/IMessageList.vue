<script setup lang="ts">
import { closeMessage, messages } from './messageState'

const icons: Record<string, string> = { info: 'i', success: '✓', warning: '!', danger: '×' }
</script>

<template>
  <!-- aria-live 让读屏软件在不抢焦点的前提下播报新消息 -->
  <div class="i-message-list" role="status" aria-live="polite">
    <TransitionGroup name="i-message">
      <div v-for="item in messages" :key="item.id" class="i-message" :class="`i-message--${item.type}`">
        <span class="i-message__icon" aria-hidden="true">{{ icons[item.type] }}</span>
        <span class="i-message__text">{{ item.content }}</span>
        <button v-if="item.closable" class="i-message__close" aria-label="关闭" @click="closeMessage(item.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.i-message-list {
  position: fixed;
  top: var(--i-spacing-6);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--i-z-toast);
  display: grid;
  gap: var(--i-spacing-2);
  justify-items: center;
  pointer-events: none;
}
.i-message {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  max-width: 80vw;
  padding: var(--i-spacing-2) var(--i-spacing-4);
  background: var(--i-color-bg);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-md);
  box-shadow: var(--i-shadow-lg);
  font-size: var(--i-font-size-md);
  color: var(--i-color-text);
  pointer-events: auto;
}
.i-message__icon {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: var(--i-radius-full);
  font-size: var(--i-font-size-xs);
  color: #fff;
}
.i-message--info .i-message__icon { background: var(--i-color-info); }
.i-message--success .i-message__icon { background: var(--i-color-success); }
.i-message--warning .i-message__icon { background: var(--i-color-warning); }
.i-message--danger .i-message__icon { background: var(--i-color-danger); }
.i-message__close {
  border: none;
  background: none;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-lg);
  line-height: 1;
  cursor: pointer;
}

.i-message-enter-active,
.i-message-leave-active { transition: all var(--i-motion-base) var(--i-motion-easing); }
.i-message-enter-from,
.i-message-leave-to { opacity: 0; transform: translateY(-12px); }
.i-message-leave-active { position: absolute; }
</style>
