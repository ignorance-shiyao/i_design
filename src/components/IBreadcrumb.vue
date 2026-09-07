<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  /** 传入路由地址则渲染为链接，末项通常不传 */
  to?: string
}

withDefaults(defineProps<{ items: BreadcrumbItem[]; separator?: string }>(), { separator: '/' })
</script>

<template>
  <nav class="i-breadcrumb" aria-label="面包屑">
    <ol>
      <li v-for="(item, index) in items" :key="item.label">
        <RouterLink v-if="item.to && index < items.length - 1" :to="item.to">{{ item.label }}</RouterLink>
        <!-- 末项代表当前位置，不作为链接，并标记 aria-current -->
        <span v-else :aria-current="index === items.length - 1 ? 'page' : undefined">{{ item.label }}</span>
        <span v-if="index < items.length - 1" class="i-breadcrumb__sep" aria-hidden="true">{{ separator }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.i-breadcrumb ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--i-spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--i-font-size-md);
}
.i-breadcrumb li { display: flex; align-items: center; gap: var(--i-spacing-2); }
.i-breadcrumb a { color: var(--i-color-text-secondary); }
.i-breadcrumb a:hover { color: var(--i-color-brand); }
.i-breadcrumb [aria-current='page'] { color: var(--i-color-text); font-weight: 500; }
.i-breadcrumb__sep { color: var(--i-color-text-tertiary); }
</style>
