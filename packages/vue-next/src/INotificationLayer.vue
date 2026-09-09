<script setup lang="ts">
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'
import { closeNotification, notifications, type NotificationType } from './notification'
import type { IconName } from './icons'

const ICONS: Record<NotificationType, IconName> = {
  info: 'info-circle',
  success: 'check-circle',
  warning: 'warning-triangle',
  danger: 'error-circle'
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup tag="div" name="i-notification" class="i-notification-layer">
      <div
        v-for="item in notifications"
        :key="item.id"
        class="i-notification"
        :class="`i-notification--${item.type}`"
        role="status"
      >
        <span class="i-notification__icon"><IIcon :name="ICONS[item.type]" :size="18" /></span>
        <div class="i-notification__body">
          <p class="i-notification__title">{{ item.title }}</p>
          <p v-if="item.description" class="i-notification__desc">{{ item.description }}</p>
          <div v-if="item.actions?.length" class="i-notification__actions">
            <IButton
              v-for="action in item.actions"
              :key="action.label"
              size="sm"
              @click="action.onClick(); closeNotification(item.id)"
            >
              {{ action.label }}
            </IButton>
          </div>
        </div>
        <button class="i-notification__close" aria-label="关闭" @click="closeNotification(item.id)">
          <IIcon name="close" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>
