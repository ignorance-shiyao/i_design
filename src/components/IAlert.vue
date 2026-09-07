<script setup lang="ts">
import { computed } from 'vue'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{ type?: 'info' | 'success' | 'warning' | 'danger'; title?: string; closable?: boolean }>(),
  { type: 'info', title: '', closable: false }
)
defineEmits<{ close: [] }>()

const iconOf: Record<string, IconName> = {
  info: 'info-circle',
  success: 'check-circle',
  warning: 'warning-triangle',
  danger: 'error-circle'
}
const icon = computed(() => iconOf[props.type])
</script>

<template>
  <div class="i-alert" :class="`i-alert--${type}`" role="alert">
    <IIcon class="i-alert__icon" :name="icon" :size="18" />
    <div class="i-alert__content">
      <strong v-if="title" class="i-alert__title">{{ title }}</strong>
      <div class="i-alert__desc"><slot /></div>
    </div>
    <button v-if="closable" class="i-alert__close" aria-label="关闭" @click="$emit('close')">
      <IIcon name="close" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.i-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--i-spacing-3);
  padding: var(--i-spacing-3) var(--i-spacing-4);
  border-radius: var(--i-radius-md);
  border-left: 3px solid transparent;
  font-size: var(--i-font-size-md);
}
.i-alert__icon { margin-top: 3px; }
.i-alert--info .i-alert__icon { color: var(--i-color-info); }
.i-alert--success .i-alert__icon { color: var(--i-color-success); }
.i-alert--warning .i-alert__icon { color: var(--i-color-warning); }
.i-alert--danger .i-alert__icon { color: var(--i-color-danger); }
.i-alert__content { flex: 1; }
.i-alert__title { display: block; margin-bottom: var(--i-spacing-1); color: var(--i-color-text); }
.i-alert__desc { color: var(--i-color-text-secondary); }
.i-alert__close {
  border: none;
  background: none;
  cursor: pointer;
  line-height: 1;
  color: var(--i-color-text-tertiary);
  display: grid;
  place-items: center;
  padding: 2px;
  border-radius: var(--i-radius-sm);
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing);
}
.i-alert__close:hover { color: var(--i-color-text); background: var(--i-color-hairline); }
.i-alert--info { background: var(--i-color-info-subtle); border-left-color: var(--i-color-info); }
.i-alert--success { background: var(--i-color-success-subtle); border-left-color: var(--i-color-success); }
.i-alert--warning { background: var(--i-color-warning-subtle); border-left-color: var(--i-color-warning); }
.i-alert--danger { background: var(--i-color-danger-subtle); border-left-color: var(--i-color-danger); }
</style>
