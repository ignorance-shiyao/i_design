<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITable.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
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
    /** 开启行选择：多选场景下的批量操作靠它 */
    selectable?: boolean
    /** 已选行的 rowKey 值 */
    selected?: (string | number)[]
  }>(),
  {
    rowKey: 'id',
    size: 'md',
    striped: false,
    loading: false,
    emptyText: '暂无数据',
    selectable: false,
    selected: () => []
  }
)

const emit = defineEmits<{ (e: 'update:selected', a0: (string | number)[]): void }>()

const keyOf = (row: TableRow) => row[props.rowKey] as string | number
const isChecked = (row: TableRow) => props.selected.includes(keyOf(row))

/*
 * 全选只作用于当前这一页的数据，而不是整份数据源。
 *
 * 分页表格里「全选」若悄悄勾上没显示出来的行，用户点下删除时删掉的
 * 远比他看到的多——这是最典型的一种误操作，代价还不可逆。
 */
const allKeys = computed(() => sortedData.value.map(keyOf))
const allChecked = computed(
  () => allKeys.value.length > 0 && allKeys.value.every((k) => props.selected.includes(k))
)
// 半选：部分勾选时表头必须是第三种状态，否则看上去像「一个都没选」
const someChecked = computed(
  () => !allChecked.value && allKeys.value.some((k) => props.selected.includes(k))
)

function toggleRow(row: TableRow) {
  const key = keyOf(row)
  emit(
    'update:selected',
    isChecked(row) ? props.selected.filter((k) => k !== key) : [...props.selected, key]
  )
}

function toggleAll() {
  if (allChecked.value) {
    emit('update:selected', props.selected.filter((k) => !allKeys.value.includes(k)))
    return
  }
  // 合并而不是覆盖：其他页选中的行不该因为这一页全选而丢掉
  const next = new Set(props.selected)
  allKeys.value.forEach((k) => next.add(k))
  emit('update:selected', [...next])
}

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
          <th v-if="selectable" class="i-table-c__check-cell">
            <input
              type="checkbox"
              class="i-table-c__check"
              aria-label="全选本页"
              :checked="allChecked"
              :indeterminate="someChecked"
              @change="toggleAll"
            />
          </th>
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
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="i-table-c__state">加载中…</td>
        </tr>
        <tr v-else-if="!sortedData.length">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="i-table-c__state">{{ emptyText }}</td>
        </tr>
        <tr
          v-for="(row, index) in sortedData"
          v-else
          :key="row[rowKey] ?? index"
          :class="{ 'is-selected': selectable && isChecked(row) }"
        >
          <td v-if="selectable" class="i-table-c__check-cell">
            <input
              type="checkbox"
              class="i-table-c__check"
              :aria-label="`选择第 ${index + 1} 行`"
              :checked="isChecked(row)"
              @change="toggleRow(row)"
            />
          </td>
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
