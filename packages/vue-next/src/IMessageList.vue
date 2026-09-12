<script setup lang="ts">
import { closeMessage, messages } from './messageState'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'
import { useConfig } from './useConfig'

const iconOf: Record<string, IconName> = {
  info: 'info-circle',
  success: 'check-circle',
  warning: 'warning-triangle',
  danger: 'error-circle'
}

const { locale } = useConfig()
</script>

<template>
  <!-- aria-live 让读屏软件在不抢焦点的前提下播报新消息 -->
  <div class="i-message-list" role="status" aria-live="polite">
    <TransitionGroup name="i-message">
      <div v-for="item in messages" :key="item.id" class="i-message" :class="`i-message--${item.type}`">
        <IIcon class="i-message__icon" :name="iconOf[item.type]" :size="18" />
        <span class="i-message__text">{{ item.content }}</span>
        <button v-if="item.closable" class="i-message__close" :aria-label="locale.close" @click="closeMessage(item.id)">
          <IIcon name="close" :size="15" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
