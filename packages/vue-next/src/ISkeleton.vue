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
