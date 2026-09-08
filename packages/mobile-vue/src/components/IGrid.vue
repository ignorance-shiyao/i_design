<script setup lang="ts">
import IIcon from './_Icon.vue'
import type { IconName } from '@i-design/common'

export interface GridItem {
  label: string
  icon: IconName
  value?: string
}

withDefaults(
  defineProps<{
    items: GridItem[]
    columns?: number
    /** 格子之间画分隔线 */
    bordered?: boolean
  }>(),
  { columns: 4, bordered: false }
)

defineEmits<{ select: [GridItem, number] }>()
</script>

<template>
  <!-- 图标在上文字在下：横排图文在小屏上一行放不下三个以上 -->
  <div
    class="i-grid"
    :class="{ 'i-grid--bordered': bordered }"
    :style="{ '--i-grid-columns': columns }"
  >
    <button
      v-for="(item, index) in items"
      :key="item.label"
      class="i-grid__item"
      @click="$emit('select', item, index)"
    >
      <span class="i-grid__icon"><IIcon :name="item.icon" :size="20" /></span>
      <span class="i-grid__text">{{ item.label }}</span>
    </button>
  </div>
</template>
