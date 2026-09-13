<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IList.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
export interface ListItem {
  title: string
  description?: string
  /** 附加信息，如时间、作者 */
  meta?: string[]
  disabled?: boolean
}

withDefaults(
  defineProps<{
    items: ListItem[]
    /** 去掉外框与底色，用于嵌在卡片里 */
    plain?: boolean
    header?: string
    footer?: string
    clickable?: boolean
  }>(),
  { items: () => [], plain: false, header: '', footer: '', clickable: false }
)

defineEmits<{ (e: 'select', a0: ListItem, a1: number): void }>()
</script>

<template>
  <!-- 与 Table 的分工：表格用于横向比较字段，列表用于逐条阅读 -->
  <div class="i-list" :class="{ 'i-list--plain': plain }">
    <div v-if="header" class="i-list__header">{{ header }}</div>

    <!--
      删掉中间一项时，其余项若不做过渡会瞬间跳到新位置，读者会以为「又刷新了一次」，
      也看不出到底哪一项没了。-move 让它们平滑补位。
    -->
    <TransitionGroup name="i-list">
      <div
        v-for="(item, index) in items"
        :key="item.title + index"
        class="i-list__item"
        :class="{ 'is-clickable': clickable && !item.disabled }"
        @click="clickable && !item.disabled && $emit('select', item, index)"
      >
        <div v-if="$scopedSlots.media" class="i-list__media">
          <slot name="media" :item="item" :index="index" />
        </div>

        <div class="i-list__body">
          <div class="i-list__title">{{ item.title }}</div>
          <div v-if="item.description" class="i-list__desc">{{ item.description }}</div>
          <div v-if="item.meta?.length" class="i-list__meta">
            <span v-for="meta in item.meta" :key="meta">{{ meta }}</span>
          </div>
        </div>

        <div v-if="$scopedSlots.extra" class="i-list__extra">
          <slot name="extra" :item="item" :index="index" />
        </div>
      </div>
    </TransitionGroup>

    <div v-if="footer" class="i-list__footer">{{ footer }}</div>
  </div>
</template>
