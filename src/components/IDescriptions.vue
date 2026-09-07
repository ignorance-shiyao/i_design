<script setup lang="ts">
export interface DescriptionItem {
  label: string
  value?: string | number
  /** 跨列数，用于地址、备注这类长字段 */
  span?: number
  /** 具名插槽，用于渲染标签、链接等自定义内容 */
  slot?: string
}

withDefaults(
  defineProps<{
    items: DescriptionItem[]
    title?: string
    column?: number
    /** 标签在左（紧凑）或在上（长值更易读） */
    layout?: 'horizontal' | 'vertical'
    bordered?: boolean
    size?: 'sm' | 'md'
  }>(),
  { title: '', column: 2, layout: 'horizontal', bordered: true, size: 'md' }
)
</script>

<template>
  <section class="i-desc" :class="[`is-${layout}`, `i-desc--${size}`, { 'is-bordered': bordered }]">
    <header v-if="title || $slots.extra" class="i-desc__head">
      <h3 class="i-desc__title">{{ title }}</h3>
      <div v-if="$slots.extra" class="i-desc__extra"><slot name="extra" /></div>
    </header>

    <dl class="i-desc__body" :style="{ '--i-desc-column': column }">
      <div
        v-for="item in items"
        :key="item.label"
        class="i-desc__item"
        :style="{ gridColumn: `span ${Math.min(item.span ?? 1, column)}` }"
      >
        <dt class="i-desc__label">{{ item.label }}</dt>
        <dd class="i-desc__value">
          <slot :name="item.slot ?? item.label" :item="item">
            <!-- 空值显示占位符而不是留白，否则用户分不清「没有」和「没加载出来」 -->
            <span v-if="item.value === '' || item.value === undefined || item.value === null" class="i-desc__empty">—</span>
            <template v-else>{{ item.value }}</template>
          </slot>
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.i-desc.is-bordered {
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-xl);
  background: var(--i-color-bg-elevated);
  overflow: hidden;
}
.i-desc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-4);
  padding: var(--i-spacing-4) var(--i-spacing-5);
  border-bottom: 1px solid var(--i-color-hairline);
}
.i-desc__title { font-size: var(--i-font-size-lg); }

.i-desc__body {
  display: grid;
  grid-template-columns: repeat(var(--i-desc-column), minmax(0, 1fr));
  gap: var(--i-spacing-4) var(--i-spacing-6);
  margin: 0;
  padding: var(--i-spacing-5);
}
.i-desc:not(.is-bordered) .i-desc__body { padding: 0; }
.i-desc--sm .i-desc__body { gap: var(--i-spacing-3) var(--i-spacing-5); font-size: var(--i-font-size-sm); }

.i-desc__item { min-width: 0; }
.i-desc.is-horizontal .i-desc__item {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--i-spacing-3);
  align-items: baseline;
}
.i-desc__label {
  color: var(--i-color-text-tertiary);
  white-space: nowrap;
}
.i-desc.is-vertical .i-desc__label { margin-bottom: var(--i-spacing-1); font-size: var(--i-font-size-sm); }
.i-desc__value {
  margin: 0;
  color: var(--i-color-text);
  min-width: 0;
  overflow-wrap: anywhere;
}
.i-desc__empty { color: var(--i-color-text-tertiary); }

@media (max-width: 640px) {
  .i-desc__body { grid-template-columns: 1fr; }
  .i-desc__item { grid-column: span 1 !important; }
}
</style>
