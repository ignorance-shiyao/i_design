<script setup lang="ts">
import { computed } from 'vue'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'
import { useConfig } from './useConfig'

const props = withDefaults(
  defineProps<{ type?: 'info' | 'success' | 'warning' | 'danger'; title?: string; closable?: boolean }>(),
  { type: 'info', title: '', closable: false }
)

const { locale } = useConfig()
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
    <button v-if="closable" class="i-alert__close" :aria-label="locale.close" @click="$emit('close')">
      <IIcon name="close" :size="16" />
    </button>
  </div>
</template>
