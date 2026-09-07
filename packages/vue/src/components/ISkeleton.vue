<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    variant?: 'text' | 'paragraph' | 'card' | 'list' | 'avatar'
    rows?: number
    animated?: boolean
  }>(),
  { loading: true, variant: 'paragraph', rows: 3, animated: true }
)

// 末行更短，视觉上更接近真实段落
const widths = computed(() =>
  Array.from({ length: props.rows }, (_, i) => (i === props.rows - 1 ? '62%' : '100%'))
)
</script>

<template>
  <!-- Vue 2 需要单根：加载完成后这一层仍在，但不带任何样式，不影响布局 -->
  <div class="i-skeleton-host">
    <slot v-if="!loading" />
    <div v-else class="i-skeleton" :class="{ 'is-animated': animated }" aria-busy="true" aria-live="polite">
      <span v-if="variant === 'text'" class="i-skeleton__bar" style="width: 40%" />

      <template v-else-if="variant === 'paragraph'">
        <span v-for="(w, i) in widths" :key="i" class="i-skeleton__bar" :style="{ width: w }" />
      </template>

      <div v-else-if="variant === 'avatar'" class="i-skeleton__row">
        <span class="i-skeleton__circle" />
        <div class="i-skeleton__col">
          <span class="i-skeleton__bar" style="width: 120px" />
          <span class="i-skeleton__bar i-skeleton__bar--sm" style="width: 180px" />
        </div>
      </div>

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
  </div>
</template>
