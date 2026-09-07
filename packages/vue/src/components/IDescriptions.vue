<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IDescriptions.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
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
