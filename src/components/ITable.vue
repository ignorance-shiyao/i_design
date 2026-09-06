<script setup lang="ts">
import { computed, ref } from 'vue'

export type TableRow = Record<string, any>

export interface TableColumn {
  /** 取值字段名，同时作为具名插槽的名字 */
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  /** 开启后表头可点击切换 升序 → 降序 → 不排序 */
  sortable?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    data: TableRow[]
    rowKey?: string
    size?: 'sm' | 'md'
    striped?: boolean
    loading?: boolean
    emptyText?: string
  }>(),
  { rowKey: 'id', size: 'md', striped: false, loading: false, emptyText: '暂无数据' }
)

type SortOrder = 'asc' | 'desc' | null
const sortKey = ref<string | null>(null)
const sortOrder = ref<SortOrder>(null)

function toggleSort(column: TableColumn) {
  if (!column.sortable) return
  if (sortKey.value !== column.key) {
    sortKey.value = column.key
    sortOrder.value = 'asc'
    return
  }
  // 同一列上循环：升序 → 降序 → 恢复原始顺序
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : sortOrder.value === 'desc' ? null : 'asc'
  if (sortOrder.value === null) sortKey.value = null
}

const sortedData = computed(() => {
  if (!sortKey.value || !sortOrder.value) return props.data
  const key = sortKey.value
  const factor = sortOrder.value === 'asc' ? 1 : -1
  return [...props.data].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av === bv) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
    return String(av).localeCompare(String(bv), 'zh-CN') * factor
  })
})

function ariaSort(column: TableColumn) {
  if (!column.sortable) return undefined
  if (sortKey.value !== column.key || !sortOrder.value) return 'none'
  return sortOrder.value === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="i-table-wrap">
    <table class="i-table-c" :class="[`i-table-c--${size}`, { 'is-striped': striped }]">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ width: column.width, textAlign: column.align ?? 'left' }"
            :class="{ 'is-sortable': column.sortable }"
            :aria-sort="ariaSort(column)"
            @click="toggleSort(column)"
          >
            <span class="i-table-c__th">
              {{ column.title }}
              <span v-if="column.sortable" class="i-table-c__sorter">
                <i :class="{ 'is-on': sortKey === column.key && sortOrder === 'asc' }" data-dir="up" />
                <i :class="{ 'is-on': sortKey === column.key && sortOrder === 'desc' }" data-dir="down" />
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="i-table-c__state">加载中…</td>
        </tr>
        <tr v-else-if="!sortedData.length">
          <td :colspan="columns.length" class="i-table-c__state">{{ emptyText }}</td>
        </tr>
        <tr v-for="(row, index) in sortedData" v-else :key="row[rowKey] ?? index">
          <td
            v-for="column in columns"
            :key="column.key"
            :style="{ textAlign: column.align ?? 'left' }"
          >
            <!-- 每列开放一个同名插槽，用于渲染标签、按钮等自定义内容 -->
            <slot :name="column.key" :row="row" :value="row[column.key]" :index="index">
              {{ row[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.i-table-wrap { width: 100%; overflow-x: auto; }
.i-table-c {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--i-font-size-md);
}
.i-table-c th,
.i-table-c td {
  padding: var(--i-spacing-3) var(--i-spacing-4);
  border-bottom: 1px solid var(--i-color-border);
  white-space: nowrap;
}
.i-table-c--sm th,
.i-table-c--sm td { padding: var(--i-spacing-2) var(--i-spacing-3); font-size: var(--i-font-size-sm); }

.i-table-c th {
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text);
  font-weight: 600;
  text-align: left;
}
.i-table-c th.is-sortable { cursor: pointer; user-select: none; }
.i-table-c th.is-sortable:hover { color: var(--i-color-brand); }
.i-table-c__th { display: inline-flex; align-items: center; gap: var(--i-spacing-2); }
.i-table-c__sorter { display: inline-flex; flex-direction: column; gap: 2px; }
.i-table-c__sorter i {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
}
.i-table-c__sorter i[data-dir='up'] { border-bottom: 5px solid var(--i-color-border-strong); }
.i-table-c__sorter i[data-dir='down'] { border-top: 5px solid var(--i-color-border-strong); }
.i-table-c__sorter i[data-dir='up'].is-on { border-bottom-color: var(--i-color-brand); }
.i-table-c__sorter i[data-dir='down'].is-on { border-top-color: var(--i-color-brand); }

.i-table-c td { color: var(--i-color-text-secondary); }
.i-table-c tbody tr { transition: background var(--i-motion-fast) var(--i-motion-easing); }
.i-table-c tbody tr:hover { background: var(--i-color-bg-subtle); }
.i-table-c.is-striped tbody tr:nth-child(even) { background: var(--i-color-bg-subtle); }
.i-table-c.is-striped tbody tr:nth-child(even):hover { background: var(--i-color-bg-muted); }

.i-table-c__state {
  padding: var(--i-spacing-10);
  text-align: center;
  color: var(--i-color-text-tertiary);
}
.i-table-c__state:hover { background: none; }
</style>
