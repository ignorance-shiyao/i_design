<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITreeTable.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 树表与分组汇总（astra.md 的 B06）。
 *
 * 三条规矩都在 `logic/treetable.ts` 里，这里只负责把它们摆出来：
 *
 * - 排序只在兄弟之间排，子行不会跑到别人家下面去；
 * - 折叠不丢选择，表头上那句「其中 N 项在收起的分组里」一直在——
 *   没有它，用户按下删除才发现删掉了看不见的几行；
 * - 汇总按全部叶子行算，折叠不会让合计数字变小。
 *
 * 层级只用**缩进 + 展开箭头**表示：拿加粗的边线或整行底色去标「这是父行」，
 * 既是 CLAUDE.md 禁的那条，也让真正需要着色的选中行没了对比。
 */
import { computed } from 'vue'
import {
  expandAll,
  bodyCellSpans,
  buildHeaderLayout,
  flattenRows,
  grandTotal,
  groupSummary,
  nextSortOrder,
  rowSelectable,
  selectAllState,
  selectionSummary,
  sortTree,
  summaryLabel,
  toggleExpanded,
  toggleRow,
  renderRows,
  toggleSelectAll,
  type AggregateSpec,
  type SortOrder,
  type TreeRow
} from '@i-design/common'
import type { TreeTableColumnSpec } from '@i-design/common'
import IIcon from './IIcon.vue'

export interface TreeTableColumn extends TreeTableColumnSpec {}

const props = withDefaults(
  defineProps<{
    columns: TreeTableColumn[]
    data: TreeRow[]
    /** 展开的行 key，受控 */
    expanded?: string[]
    /** 已选行 key，受控 */
    selected?: string[]
    selectable?: boolean
    sortKey?: string | null
    sortOrder?: SortOrder
    /** 每个分组下要汇总哪些字段。给了才出现小计行 */
    aggregates?: AggregateSpec[]
    /** 是否在最后加一行合计 */
    showTotal?: boolean
    size?: 'sm' | 'md'
    /** 第一列（带缩进与箭头的那一列）取哪个字段作标题 */
    labelKey?: string
  }>(),
  {
    expanded: () => [],
    selected: () => [],
    selectable: false,
    sortKey: null,
    sortOrder: null,
    aggregates: () => [],
    showTotal: false,
    size: 'md',
    labelKey: 'name'
  }
)

const emit = defineEmits<{
  (event: 'update:expanded', value: string[]): void
  (event: 'update:selected', value: string[]): void
  (event: 'update:sortKey', value: string | null): void
  (event: 'update:sortOrder', value: SortOrder): void
}>()

/* 排序只在兄弟之间排——共享逻辑负责递归，这里拿到的已经是排好的树 */
const sorted = computed(() => sortTree(props.data, props.sortKey, props.sortOrder))
const rows = computed(() => flattenRows(sorted.value, props.expanded))
/* 小计跟在这个分组最后一条子行之后——摆在标题下面会读成这一行自己的数字 */
const entries = computed(() => renderRows(sorted.value, props.expanded, props.aggregates.length > 0))
const header = computed(() => buildHeaderLayout(props.columns))
/* buildHeaderLayout 已保证叶子有 key；在类型层也收窄，模板索引就不会把分组列误当正文列。 */
const leafColumns = computed(() =>
  header.value.leaves.filter((column): column is TreeTableColumn & { key: string } => Boolean(column.key))
)
/* 合并取排序后的渲染序列：被排序、小计或层级打断就立刻断开。 */
const spans = computed(() => bodyCellSpans(entries.value, leafColumns.value))

const summary = computed(() => selectionSummary(props.selected, rows.value))
const allState = computed(() => selectAllState(props.data, props.selected))

const total = computed(() =>
  props.showTotal && props.aggregates.length ? grandTotal(props.data, props.aggregates) : null
)

const colCount = computed(() => leafColumns.value.length + (props.selectable ? 1 : 0))

function onSort(column: TreeTableColumnSpec) {
  if (!column.sortable) return
  if (props.sortKey !== column.key) {
    emit('update:sortKey', column.key)
    emit('update:sortOrder', 'asc')
    return
  }
  const next = nextSortOrder(props.sortOrder)
  emit('update:sortOrder', next)
  if (!next) emit('update:sortKey', null)
}

function ariaSort(column: TreeTableColumnSpec) {
  if (!column.sortable) return undefined
  if (props.sortKey !== column.key || !props.sortOrder) return 'none'
  return props.sortOrder === 'asc' ? 'ascending' : 'descending'
}

/* 折叠只动展开集合，绝不动选择：收起是视图操作，不是取消选择 */
function onToggleExpand(key: string) {
  emit('update:expanded', [...toggleExpanded(props.expanded, key)])
}

function onExpandAll() {
  const all = expandAll(props.data)
  emit('update:expanded', props.expanded.length >= all.size ? [] : [...all])
}

function onToggleRow(key: string) {
  emit('update:selected', [...toggleRow(props.data, props.selected, key)])
}

function onToggleAll() {
  emit('update:selected', [...toggleSelectAll(props.data, props.selected)])
}

const format = (value: number | null) =>
  value === null ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(2)
</script>

<template>
  <div class="i-tree-table">
    <!--
      选择摘要。「其中 N 项在收起的分组里」是用户敢按下一步的前提，
      所以它跟着选择一起出现，不等用户去点什么才显示。
    -->
    <div v-if="selectable" class="i-tree-table__summary-bar" role="status">
      <span>{{ summary.text }}</span>
      <span v-if="summary.hidden > 0" class="i-tree-table__hidden">
        <IIcon name="eye-off" :size="12" />
        {{ summary.hidden }} 项已折叠
      </span>
      <button type="button" class="i-button i-button--sm" @click="onExpandAll">
        {{ expanded.length ? '全部收起' : '全部展开' }}
      </button>
    </div>

    <div class="i-table-wrap">
      <table class="i-table-c" :class="`i-table-c--${size}`">
        <thead>
          <tr v-for="(headerRow, headerIndex) in header.rows" :key="headerIndex">
            <th v-if="selectable && headerIndex === 0" :rowspan="header.depth" class="i-table-c__check-cell">
              <input
                type="checkbox"
                class="i-table-c__check"
                aria-label="全选（含收起的分组里的行）"
                :checked="allState === 'all'"
                :indeterminate="allState === 'some'"
                @change="onToggleAll"
              />
            </th>
            <th
              v-for="cell in headerRow"
              :key="cell.column.key ?? `${headerIndex}-${cell.column.title}`"
              :colspan="cell.colSpan"
              :rowspan="cell.rowSpan"
              :style="{ width: cell.column.width, textAlign: cell.column.align ?? (cell.column.numeric ? 'right' : 'left') }"
              :class="{ 'is-sortable': cell.column.sortable }"
              :aria-sort="ariaSort(cell.column)"
              @click="onSort(cell.column)"
            >
              <span class="i-table-c__th">
                {{ cell.column.title }}
                <span v-if="cell.column.sortable" class="i-table-c__sorter">
                  <i :class="{ 'is-on': sortKey === cell.column.key && sortOrder === 'asc' }" data-dir="up" />
                  <i :class="{ 'is-on': sortKey === cell.column.key && sortOrder === 'desc' }" data-dir="down" />
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="entry in entries" :key="entry.kind === 'row' ? entry.row.key : `${entry.groupKey}__summary`">
            <tr
              v-if="entry.kind === 'row'"
              :class="{ 'is-selected': selectable && selected.includes(entry.row.key) }"
            >
              <td v-if="selectable" class="i-table-c__check-cell">
                <input
                  type="checkbox"
                  class="i-table-c__check"
                  :aria-label="`选择 ${entry.row.row[labelKey] ?? entry.row.key}`"
                  :checked="selected.includes(entry.row.key)"
                  :disabled="!rowSelectable(entry.row.row)"
                  :title="entry.row.row.selectableReason | undefined"
                  @change="onToggleRow(entry.row.key)"
                />
              </td>
              <template v-for="(column, index) in leafColumns" :key="column.key">
              <td
                v-if="spans.get(`${entry.row.key}:${column.key}`)?.rowSpan !== 0"
                :rowspan="spans.get(`${entry.row.key}:${column.key}`)?.rowSpan || undefined"
                :class="{ 'i-tree-table__num': column.numeric }"
                :style="{ textAlign: column.align ?? (column.numeric ? 'right' : 'left') }"
              >
                <!-- 第一列带缩进与箭头：层级只靠这两样表示 -->
                <span
                  v-if="index === 0"
                  class="i-tree-table__label"
                  :style="{ paddingLeft: `${entry.row.level * 20}px` }"
                >
                  <button
                    v-if="entry.row.hasChildren"
                    type="button"
                    class="i-tree-table__toggle"
                    :class="{ 'is-open': entry.row.expanded }"
                    :aria-expanded="String(entry.row.expanded)"
                    :aria-label="`${entry.row.expanded ? '收起' : '展开'} ${entry.row.row[labelKey] ?? entry.row.key}`"
                    @click="onToggleExpand(entry.row.key)"
                  >
                    <IIcon name="chevron-right" :size="14" />
                  </button>
                  <span v-else class="i-tree-table__toggle-placeholder" />
                  <span>
                    <slot :name="column.key" :row="entry.row.row" :value="entry.row.row[column.key]">
                      {{ entry.row.row[column.key] }}
                    </slot>
                  </span>
                  <!-- 不可选的行把理由写在旁边：只禁用不说理由，用户只会反复点 -->
                  <span v-if="!rowSelectable(entry.row.row)" class="i-tree-table__blocked">
                    {{ entry.row.row.selectableReason }}
                  </span>
                </span>
                <slot v-else :name="column.key" :row="entry.row.row" :value="entry.row.row[column.key]">
                  {{ entry.row.row[column.key] }}
                </slot>
              </td>
              </template>
            </tr>

            <!-- 小计：按这个分组全部叶子行算，收起再展开也还是同一个数 -->
            <tr v-else class="i-tree-table__row--summary">
              <td v-if="selectable" />
              <td
                v-for="(column, index) in leafColumns"
                :key="column.key"
                :class="{ 'i-tree-table__num': column.numeric }"
                :style="{ textAlign: column.align ?? (column.numeric ? 'right' : 'left') }"
              >
                <span v-if="index === 0" :style="{ paddingLeft: `${(entry.level + 1) * 20}px` }">
                  {{ summaryLabel(groupSummary(entry.group, aggregates)) }}
                </span>
                <template v-else-if="groupSummary(entry.group, aggregates).values[column.key] !== undefined">
                  {{ format(groupSummary(entry.group, aggregates).values[column.key]) }}
                </template>
              </td>
            </tr>
          </template>

          <tr v-if="total" class="i-tree-table__row--total">
            <td v-if="selectable" />
            <td v-for="(column, index) in leafColumns" :key="column.key" :class="{ 'i-tree-table__num': column.numeric }"
                :style="{ textAlign: column.align ?? (column.numeric ? 'right' : 'left') }">
              <template v-if="index === 0">{{ summaryLabel(total, '合计') }}</template>
              <template v-else-if="total.values[column.key] !== undefined">
                {{ format(total.values[column.key]) }}
              </template>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td :colspan="colCount" class="i-table-c__state">没有数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
