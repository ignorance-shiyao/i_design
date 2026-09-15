/**
 * TreeTable —— 树表与分组汇总（astra.md 的 B06）。
 *
 * 判断全在 logic/treetable.ts，五端共用一份：排序只在兄弟之间排、
 * 折叠不丢选择（并且把「有几项在收起的分组里」数出来）、
 * 汇总按全部叶子行算因而不受折叠影响。
 *
 * 小程序没有 table，用 flex 行列模拟；层级照样只靠缩进与一个箭头表示。
 */
import {
  flattenRows,
  renderRows,
  grandTotal,
  groupSummary,
  rowSelectable,
  selectAllState,
  selectionSummary,
  sortTree,
  summaryLabel,
  toggleExpanded,
  toggleRow,
  toggleSelectAll
} from '@i-design/common'

const format = (value) =>
  value === null || value === undefined ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(2)

Component({
  options: { addGlobalClass: true },
  properties: {
    columns: { type: Array, value: [] },
    data: { type: Array, value: [] },
    /** 展开的行 key，受控 */
    expanded: { type: Array, value: [] },
    /** 已选行 key，受控 */
    selected: { type: Array, value: [] },
    selectable: { type: Boolean, value: false },
    /** 排序列。空串表示不排序 */
    sortKey: { type: String, value: '' },
    /** asc / desc，空串表示不排序 */
    sortOrder: { type: String, value: '' },
    aggregates: { type: Array, value: [] },
    showTotal: { type: Boolean, value: false },
    labelKey: { type: String, value: 'name' }
  },
  data: {
    rows: [], summaryText: '未选择任何行', hiddenCount: 0,
    allChecked: false, someChecked: false, total: null
  },
  observers: {
    'columns, data, expanded, selected, selectable, sortKey, sortOrder, aggregates, showTotal':
      function () {
        this.refresh()
      }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const d = this.data
      const sorted = sortTree(d.data, d.sortKey || null, d.sortOrder || null)
      const flat = flattenRows(sorted, d.expanded)
      const summary = selectionSummary(d.selected, flat)
      const state = selectAllState(d.data, d.selected)

      /*
       * WXML 里跑不了函数，单元格与小计都得在这儿摊平成字符串。
       * 小计只跟在**展开着的**分组后面：收起时那一行自己就代表它。
       */
      const rows = []
      for (const entry of renderRows(sorted, d.expanded, d.aggregates.length > 0)) {
        // 小计跟在这个分组最后一条子行之后：摆在标题下面会读成这一行自己的数字
        if (entry.kind === 'summary') {
          const group = groupSummary(entry.group, d.aggregates)
          rows.push({
            key: entry.groupKey + '__summary',
            summary: true,
            indent: (entry.level + 1) * 20,
            label: summaryLabel(group),
            cells: d.columns.map((column) => ({
              key: column.key,
              numeric: !!column.numeric,
              text: column.key in group.values ? format(group.values[column.key]) : ''
            }))
          })
          continue
        }
        const row = entry.row
        rows.push({
          key: row.key,
          level: row.level,
          indent: row.level * 20,
          hasChildren: row.hasChildren,
          expanded: row.expanded,
          checked: d.selected.indexOf(row.key) >= 0,
          selectable: rowSelectable(row.row),
          blockedReason: row.row.selectableReason || '',
          label: String(row.row[d.labelKey] === undefined ? row.key : row.row[d.labelKey]),
          cells: d.columns.map((column) => ({
            key: column.key,
            numeric: !!column.numeric,
            text: row.row[column.key] === undefined ? '' : String(row.row[column.key])
          }))
        })
      }

      const total = d.showTotal && d.aggregates.length ? grandTotal(d.data, d.aggregates) : null
      this.setData({
        rows,
        summaryText: summary.text,
        hiddenCount: summary.hidden,
        allChecked: state === 'all',
        someChecked: state === 'some',
        total: total
          ? {
              label: summaryLabel(total, '合计'),
              cells: d.columns.map((column) => ({
                key: column.key,
                numeric: !!column.numeric,
                text: column.key in total.values ? format(total.values[column.key]) : ''
              }))
            }
          : null
      })
    },
    /* 折叠只动展开集合，绝不动选择：收起是视图操作，不是取消选择 */
    onToggleExpand(e) {
      const key = e.currentTarget.dataset.key
      this.triggerEvent('expandedchange', {
        expanded: [...toggleExpanded(this.data.expanded, key)]
      })
    },
    onToggleRow(e) {
      const key = e.currentTarget.dataset.key
      this.triggerEvent('selectedchange', {
        selected: [...toggleRow(this.data.data, this.data.selected, key)]
      })
    },
    onToggleAll() {
      this.triggerEvent('selectedchange', {
        selected: [...toggleSelectAll(this.data.data, this.data.selected)]
      })
    }
  }
})
