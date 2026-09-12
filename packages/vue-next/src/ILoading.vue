<script setup lang="ts">
import { computed } from 'vue'
import { useConfig } from './useConfig'

const props = withDefaults(
  defineProps<{
    /** 包裹内容时作为区域遮罩；无内容时作为独立指示器 */
    loading?: boolean
    text?: string
    size?: 'sm' | 'md' | 'lg'
    /** 遮罩是否覆盖整个父容器（父容器需为定位上下文） */
    fullscreen?: boolean
  }>(),
  { loading: true, text: '', size: 'md', fullscreen: false }
)

const { locale } = useConfig()
/* 传了就用传的，没传才回落到字典。读屏用户听到的就是这一句 */
const label = computed(() => props.text || locale.value.loading)
</script>

<template>
  <div v-if="$slots.default" class="i-loading-wrap">
    <slot />
    <div v-if="loading" class="i-loading-mask" :class="{ 'is-fullscreen': fullscreen }">
      <span class="i-loading" :class="`i-loading--${size}`" role="status" :aria-label="label">
        <span class="i-loading__spinner" />
        <span v-if="text" class="i-loading__text">{{ text }}</span>
      </span>
    </div>
  </div>
  <span
    v-else-if="loading"
    class="i-loading"
    :class="`i-loading--${size}`"
    role="status"
    :aria-label="label"
  >
    <span class="i-loading__spinner" />
    <span v-if="text" class="i-loading__text">{{ text }}</span>
  </span>
</template>
