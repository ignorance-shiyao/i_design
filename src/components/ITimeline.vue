<script setup lang="ts">
export interface TimelineItem {
  title: string
  time?: string
  description?: string
  type?: 'brand' | 'success' | 'warning' | 'danger' | 'muted'
  /** 正在发生：圆点填实 */
  current?: boolean
}

withDefaults(defineProps<{ items: TimelineItem[] }>(), { items: () => [] })
</script>

<template>
  <!-- 与 Steps 的分工：Steps 描述还没走完的流程，Timeline 记录已经发生的事 -->
  <div class="i-timeline">
    <div
      v-for="(item, index) in items"
      :key="item.title + index"
      class="i-timeline__item"
      :class="[item.type ? `i-timeline__item--${item.type}` : '', { 'is-current': item.current }]"
    >
      <div class="i-timeline__rail">
        <span class="i-timeline__dot" />
        <span class="i-timeline__line" />
      </div>
      <div class="i-timeline__content">
        <div class="i-timeline__title">{{ item.title }}</div>
        <div v-if="item.time" class="i-timeline__time">{{ item.time }}</div>
        <div v-if="item.description" class="i-timeline__desc">{{ item.description }}</div>
        <slot :name="`item-${index}`" />
      </div>
    </div>
  </div>
</template>
