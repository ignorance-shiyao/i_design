<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { rafThrottle, shouldVirtualize, virtualWindow } from '@i-design/common'
import { useConfig } from './useConfig'

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
    /**
     * 表体高度，如 `360px`。给了之后表头吸顶、表体自己滚，行多时只渲染看得见的那几行。
     * 不给时整张表平铺，由外层页面滚动。
     */
    height?: string
  }>(),
  {
    rowKey: 'id',
    size: 'md',
    striped: false,
    loading: false,
    emptyText: '',
    selectable: false,
    selected: () => [],
    height: ''
  }
)

const emit = defineEmits<{ 'update:selected': [(string | number)[]] }>()

const { locale } = useConfig()
/* 传了就用传的，没传才回落到字典——空态文案最该由调用方说清楚为什么空 */
const emptyLabel = computed(() => props.emptyText || locale.value.empty)

const wrap = ref<HTMLElement | null>(null)

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

/* ----------------------------------------------------------- 虚拟滚动 */

/*
 * 只有给了 height 才虚拟化：没有可视高度就算不出该渲染哪几行，
 * 拿一个猜的高度去算会把行定位到看不见的地方，比不虚拟化更糟。
 *
 * 撑开上下空白用的是两行 <tr>，而不是给 tbody 加 padding——
 * 表格的行高由浏览器统一分配，给 tbody 加内边距会被它重新算进去，
 * 于是空出来的高度和算出来的对不上，越往下偏得越多。
 */
const ROW_FALLBACK_HEIGHT = 44
const rowHeight = ref(ROW_FALLBACK_HEIGHT)
const scrollTop = ref(0)
const viewportHeight = ref(0)

const virtual = computed(() => Boolean(props.height) && shouldVirtualize(sortedData.value.length))
const window_ = computed(() =>
  virtualWindow(scrollTop.value, viewportHeight.value, rowHeight.value, sortedData.value.length)
)
const visibleRowsData = computed(() => {
  if (!virtual.value) return sortedData.value.map((row, index) => ({ row, index }))
  const out: { row: TableRow; index: number }[] = []
  for (let i = window_.value.start; i <= window_.value.end; i++) {
    out.push({ row: sortedData.value[i], index: i })
  }
  return out
})

/* 滚动事件远多于帧，而每次都要读一次布局 */
const onScroll = rafThrottle(() => {
  if (wrap.value) scrollTop.value = wrap.value.scrollTop
})
onBeforeUnmount(() => onScroll.cancel())

function measure() {
  const el = wrap.value
  if (!el) return
  viewportHeight.value = el.clientHeight
  const first = el.querySelector<HTMLElement>('tbody tr:not(.i-table-c__spacer)')
  if (first && first.offsetHeight > 0) rowHeight.value = first.offsetHeight
}

watch(
  () => [props.height, sortedData.value.length],
  () => nextTick(measure),
  { immediate: true }
)
</script>

<template>
  <div
    ref="wrap"
    class="i-table-wrap"
    :class="{ 'is-scrollable': !!height }"
    :style="{ height: height || undefined }"
    @scroll.passive="onScroll"
  >
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
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="i-table-c__state">{{ locale.loading }}</td>
        </tr>
        <tr v-else-if="!sortedData.length">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="i-table-c__state">{{ emptyLabel }}</td>
        </tr>
        <template v-else>
        <!-- 上下两行空白替代没渲染的那些行，滚动条长度才和真实行数相称 -->
        <tr v-if="virtual" class="i-table-c__spacer" aria-hidden="true">
          <td
            :colspan="columns.length + (selectable ? 1 : 0)"
            :style="{ height: `${window_.paddingTop}px` }"
          />
        </tr>
        <tr
          v-for="{ row, index } in visibleRowsData"
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
        <tr v-if="virtual" class="i-table-c__spacer" aria-hidden="true">
          <td
            :colspan="columns.length + (selectable ? 1 : 0)"
            :style="{ height: `${window_.paddingBottom}px` }"
          />
        </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
