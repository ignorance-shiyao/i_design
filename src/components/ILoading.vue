<script setup lang="ts">
withDefaults(
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
</script>

<template>
  <div v-if="$slots.default" class="i-loading-wrap">
    <slot />
    <div v-if="loading" class="i-loading-mask" :class="{ 'is-fullscreen': fullscreen }">
      <span class="i-loading" :class="`i-loading--${size}`" role="status" :aria-label="text || '加载中'">
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
    :aria-label="text || '加载中'"
  >
    <span class="i-loading__spinner" />
    <span v-if="text" class="i-loading__text">{{ text }}</span>
  </span>
</template>

<style scoped>
.i-loading-wrap { position: relative; }
.i-loading-mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--i-color-bg) 72%, transparent);
  backdrop-filter: blur(1px);
  border-radius: inherit;
}
.i-loading-mask.is-fullscreen { position: fixed; z-index: var(--i-z-modal); }

.i-loading {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
}
.i-loading__spinner {
  border: 2px solid var(--i-color-brand);
  border-right-color: transparent;
  border-radius: var(--i-radius-full);
  animation: i-loading-spin 700ms linear infinite;
}
.i-loading--sm .i-loading__spinner { width: 12px; height: 12px; }
.i-loading--md .i-loading__spinner { width: 18px; height: 18px; }
.i-loading--lg .i-loading__spinner { width: 26px; height: 26px; border-width: 3px; }

@keyframes i-loading-spin { to { transform: rotate(360deg); } }

/* 尊重系统的减少动效偏好：停转并改用透明度呼吸 */
@media (prefers-reduced-motion: reduce) {
  .i-loading__spinner {
    animation: i-loading-pulse 1.4s ease-in-out infinite;
    border-right-color: var(--i-color-brand);
  }
  @keyframes i-loading-pulse { 50% { opacity: 0.35; } }
}
</style>
