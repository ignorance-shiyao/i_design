<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 加载完成后渲染默认插槽；为 true 时显示骨架 */
    loading?: boolean
    /** 预设版式，省得每处都手写行数 */
    variant?: 'text' | 'paragraph' | 'card' | 'list' | 'avatar'
    rows?: number
    /** 关闭动画，用于打印或降低动效偏好 */
    animated?: boolean
  }>(),
  { loading: true, variant: 'paragraph', rows: 3, animated: true }
)

// 末行留白更短，视觉上更像真实段落
const widths = computed(() =>
  Array.from({ length: props.rows }, (_, i) => (i === props.rows - 1 ? '62%' : '100%'))
)
</script>

<template>
  <slot v-if="!loading" />
  <div v-else class="i-skeleton" :class="{ 'is-animated': animated }" aria-busy="true" aria-live="polite">
    <template v-if="variant === 'text'">
      <span class="i-skeleton__bar" style="width: 40%" />
    </template>

    <template v-else-if="variant === 'paragraph'">
      <span v-for="(w, i) in widths" :key="i" class="i-skeleton__bar" :style="{ width: w }" />
    </template>

    <template v-else-if="variant === 'avatar'">
      <div class="i-skeleton__row">
        <span class="i-skeleton__circle" />
        <div class="i-skeleton__col">
          <span class="i-skeleton__bar" style="width: 120px" />
          <span class="i-skeleton__bar i-skeleton__bar--sm" style="width: 180px" />
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'list'">
      <div v-for="i in rows" :key="i" class="i-skeleton__row i-skeleton__row--list">
        <span class="i-skeleton__circle" />
        <div class="i-skeleton__col">
          <span class="i-skeleton__bar" style="width: 45%" />
          <span class="i-skeleton__bar i-skeleton__bar--sm" style="width: 75%" />
        </div>
      </div>
    </template>

    <template v-else>
      <span class="i-skeleton__block" />
      <span class="i-skeleton__bar" style="width: 55%" />
      <span class="i-skeleton__bar i-skeleton__bar--sm" style="width: 85%" />
      <span class="i-skeleton__bar i-skeleton__bar--sm" style="width: 70%" />
    </template>
  </div>
</template>

<style scoped>
.i-skeleton { display: grid; gap: var(--i-spacing-3); width: 100%; }
.i-skeleton__row { display: flex; align-items: center; gap: var(--i-spacing-3); }
.i-skeleton__row--list + .i-skeleton__row--list { margin-top: var(--i-spacing-2); }
.i-skeleton__col { flex: 1; display: grid; gap: var(--i-spacing-2); }

.i-skeleton__bar,
.i-skeleton__circle,
.i-skeleton__block {
  display: block;
  background: var(--i-color-bg-muted);
  border-radius: var(--i-radius-md);
}
.i-skeleton__bar { height: 14px; }
.i-skeleton__bar--sm { height: 10px; }
.i-skeleton__circle { width: 40px; height: 40px; border-radius: var(--i-radius-full); flex: none; }
.i-skeleton__block { height: 120px; border-radius: var(--i-radius-lg); }

/* 微光扫过，暗示「正在来」；比闪烁更安静 */
.i-skeleton.is-animated .i-skeleton__bar,
.i-skeleton.is-animated .i-skeleton__circle,
.i-skeleton.is-animated .i-skeleton__block {
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--i-color-bg) 70%, transparent) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: i-skeleton-shine 1.4s ease-in-out infinite;
}
@keyframes i-skeleton-shine {
  from { background-position: 180% 0; }
  to { background-position: -80% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .i-skeleton.is-animated .i-skeleton__bar,
  .i-skeleton.is-animated .i-skeleton__circle,
  .i-skeleton.is-animated .i-skeleton__block { animation: none; background-image: none; }
}
</style>
