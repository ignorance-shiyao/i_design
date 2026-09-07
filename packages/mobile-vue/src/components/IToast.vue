<script setup lang="ts">
import { computed } from 'vue'
import type { IconName } from '@i-design/common'
import { currentToast } from '../toast'
import IIcon from './_Icon.vue'

const iconOf: Record<string, IconName> = {
  success: 'check-circle',
  warning: 'warning-triangle',
  error: 'error-circle',
  loading: 'refresh'
}

const icon = computed(() => (currentToast.value ? iconOf[currentToast.value.type] : undefined))
</script>

<template>
  <Transition name="i-toast-fade">
    <div v-if="currentToast" class="i-toast" role="status" aria-live="polite">
      <IIcon
        v-if="icon"
        class="i-toast__icon"
        :name="icon"
        :size="26"
        :spin="currentToast.type === 'loading'"
      />
      <span>{{ currentToast.content }}</span>
    </div>
  </Transition>
</template>
