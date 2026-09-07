<script setup lang="ts">
import IIcon from './IIcon.vue'
import type { IconName } from './icons'

export interface BreadcrumbItem {
  label: string
  /** 传入路由地址则渲染为链接，末项通常不传 */
  to?: string
}

withDefaults(
  defineProps<{
    items: BreadcrumbItem[]
    /** 传入字符串则用文字分隔；默认使用图标，视觉上比斜杠更轻 */
    separator?: string
    separatorIcon?: IconName
  }>(),
  { separator: '', separatorIcon: 'chevron-right' }
)
</script>

<template>
  <nav class="i-breadcrumb" aria-label="面包屑">
    <ol class="i-breadcrumb__list">
      <li v-for="(item, index) in items" :key="item.label" class="i-breadcrumb__item">
        <RouterLink
          v-if="item.to && index < items.length - 1"
          class="i-breadcrumb__link"
          :to="item.to"
        >{{ item.label }}</RouterLink>
        <!-- 末项代表当前位置，不作为链接，并标记 aria-current -->
        <span
          v-else
          class="i-breadcrumb__current"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >{{ item.label }}</span>
        <span v-if="index < items.length - 1" class="i-breadcrumb__sep" aria-hidden="true">
          <template v-if="separator">{{ separator }}</template>
          <IIcon v-else :name="separatorIcon" :size="14" />
        </span>
      </li>
    </ol>
  </nav>
</template>
