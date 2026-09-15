import { useMemo } from 'react'
import {
  expandAll,
  flattenRows,
  grandTotal,
  groupSummary,
  nextSortOrder,
  renderRows,
  rowSelectable,
  selectAllState,
  selectionSummary,
  sortTree,
  summaryLabel,
  toggleExpanded,
  toggleRow,
  toggleSelectAll,
  type AggregateSpec,
  type SortOrder,
  type TreeRow
} from '@i-design/common'
import { Icon } from './Icon'

export interface TreeTableColumn {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  /** 数字列：右对齐并用等宽数字 */
  numeric?: boolean
  /** 自定义单元格 */
  render?: (row: TreeRow) => React.ReactNode
}

export interface TreeTableProps {
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
  showTotal?: boolean
  size?: 'sm' | 'md'
  labelKey?: string
  onExpandedChange?: (keys: string[]) => void
  onSelectedChange?: (keys: string[]) => void
  onSortChange?: (key: string | null, order: SortOrder) => void
  className?: string
}

const format = (value: number | null) =>
  value === null ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(2)

/**
 * 树表与分组汇总（astra.md 的 B06）。
 *
 * 判断全在 logic/treetable.ts，五端共用一份：排序只在兄弟之间排、
 * 折叠不丢选择（并且把「有几项在收起的分组里」数出来）、
 * 汇总按全部叶子行算因而不受折叠影响。
 *
 * 层级只用缩进与展开箭头表示——拿加粗的边线或整行底色标「这是父行」，
 * 既是 CLAUDE.md 禁的那条，也让真正需要着色的选中行没了对比。
 */
export function TreeTable({
  columns,
  data,
  expanded = [],
  selected = [],
  selectable = false,
  sortKey = null,
  sortOrder = null,
  aggregates = [],
  showTotal = false,
  size = 'md',
  labelKey = 'name',
  onExpandedChange,
  onSelectedChange,
  onSortChange,
  className = ''
}: TreeTableProps) {
  const sorted = useMemo(() => sortTree(data, sortKey, sortOrder), [data, sortKey, sortOrder])
  const rows = useMemo(() => flattenRows(sorted, expanded), [sorted, expanded])
  /* 小计跟在这个分组最后一条子行之后——摆在标题下面会读成这一行自己的数字 */
  const entries = useMemo(
    () => renderRows(sorted, expanded, aggregates.length > 0),
    [sorted, expanded, aggregates.length]
  )
  const summary = selectionSummary(selected, rows)
  const allState = selectAllState(data, selected)
  const total = showTotal && aggregates.length ? grandTotal(data, aggregates) : null
  const colCount = columns.length + (selectable ? 1 : 0)

  const onSort = (column: TreeTableColumn) => {
    if (!column.sortable || !onSortChange) return
    if (sortKey !== column.key) {
      onSortChange(column.key, 'asc')
      return
    }
    const next = nextSortOrder(sortOrder)
    onSortChange(next ? column.key : null, next)
  }

  const ariaSort = (column: TreeTableColumn) => {
    if (!column.sortable) return undefined
    if (sortKey !== column.key || !sortOrder) return 'none' as const
    return sortOrder === 'asc' ? ('ascending' as const) : ('descending' as const)
  }

  const cell = (column: TreeTableColumn, row: TreeRow) =>
    column.render ? column.render(row) : String(row[column.key] ?? '')

  const alignOf = (column: TreeTableColumn) => column.align ?? (column.numeric ? 'right' : 'left')

  return (
    <div className={`i-tree-table ${className}`.trim()}>
      {selectable && (
        <div className="i-tree-table__summary-bar" role="status">
          <span>{summary.text}</span>
          {summary.hidden > 0 && (
            <span className="i-tree-table__hidden">
              <Icon name="eye-off" size={12} />
              {summary.hidden} 项已折叠
            </span>
          )}
          <button
            type="button"
            className="i-button i-button--sm"
            onClick={() => {
              const all = expandAll(data)
              onExpandedChange?.(expanded.length >= all.size ? [] : [...all])
            }}
          >
            {expanded.length ? '全部收起' : '全部展开'}
          </button>
        </div>
      )}

      <div className="i-table-wrap">
        <table className={`i-table-c i-table-c--${size}`}>
          <thead>
            <tr>
              {selectable && (
                <th className="i-table-c__check-cell">
                  <input
                    type="checkbox"
                    className="i-table-c__check"
                    aria-label="全选（含收起的分组里的行）"
                    checked={allState === 'all'}
                    ref={(el) => {
                      if (el) el.indeterminate = allState === 'some'
                    }}
                    onChange={() => onSelectedChange?.([...toggleSelectAll(data, selected)])}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width, textAlign: alignOf(column) }}
                  className={column.sortable ? 'is-sortable' : undefined}
                  aria-sort={ariaSort(column)}
                  onClick={() => onSort(column)}
                >
                  <span className="i-table-c__th">
                    {column.title}
                    {column.sortable && (
                      <span className="i-table-c__sorter">
                        <i
                          data-dir="up"
                          className={sortKey === column.key && sortOrder === 'asc' ? 'is-on' : undefined}
                        />
                        <i
                          data-dir="down"
                          className={sortKey === column.key && sortOrder === 'desc' ? 'is-on' : undefined}
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              if (entry.kind === 'summary') {
                const group = groupSummary(entry.group, aggregates)
                return (
                  <tr key={`${entry.groupKey}__summary`} className="i-tree-table__row--summary">
                    {selectable && <td />}
                    {columns.map((column, index) => (
                      <td
                        key={column.key}
                        className={column.numeric ? 'i-tree-table__num' : undefined}
                        style={{ textAlign: alignOf(column) }}
                      >
                        {index === 0 ? (
                          <span style={{ paddingLeft: `${(entry.level + 1) * 20}px` }}>
                            {summaryLabel(group)}
                          </span>
                        ) : group.values[column.key] !== undefined ? (
                          format(group.values[column.key])
                        ) : null}
                      </td>
                    ))}
                  </tr>
                )
              }
              const row = entry.row
              return (
                <tr
                  key={row.key}
                  className={selectable && selected.includes(row.key) ? 'is-selected' : undefined}
                >
                  {selectable && (
                    <td className="i-table-c__check-cell">
                      <input
                        type="checkbox"
                        className="i-table-c__check"
                        aria-label={`选择 ${String(row.row[labelKey] ?? row.key)}`}
                        checked={selected.includes(row.key)}
                        disabled={!rowSelectable(row.row)}
                        title={row.row.selectableReason as string | undefined}
                        onChange={() => onSelectedChange?.([...toggleRow(data, selected, row.key)])}
                      />
                    </td>
                  )}
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={column.numeric ? 'i-tree-table__num' : undefined}
                      style={{ textAlign: alignOf(column) }}
                    >
                      {index === 0 ? (
                        <span
                          className="i-tree-table__label"
                          style={{ paddingLeft: `${row.level * 20}px` }}
                        >
                          {row.hasChildren ? (
                            <button
                              type="button"
                              className={`i-tree-table__toggle${row.expanded ? ' is-open' : ''}`}
                              aria-expanded={row.expanded}
                              aria-label={`${row.expanded ? '收起' : '展开'} ${String(
                                row.row[labelKey] ?? row.key
                              )}`}
                              onClick={() => onExpandedChange?.([...toggleExpanded(expanded, row.key)])}
                            >
                              <Icon name="chevron-right" size={14} />
                            </button>
                          ) : (
                            <span className="i-tree-table__toggle-placeholder" />
                          )}
                          <span>{cell(column, row.row)}</span>
                          {!rowSelectable(row.row) && (
                            <span className="i-tree-table__blocked">{row.row.selectableReason}</span>
                          )}
                        </span>
                      ) : (
                        cell(column, row.row)
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}

            {total && (
              <tr className="i-tree-table__row--total">
                {selectable && <td />}
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className={column.numeric ? 'i-tree-table__num' : undefined}
                    style={{ textAlign: alignOf(column) }}
                  >
                    {index === 0
                      ? summaryLabel(total, '合计')
                      : total.values[column.key] !== undefined
                        ? format(total.values[column.key])
                        : null}
                  </td>
                ))}
              </tr>
            )}

            {!rows.length && (
              <tr>
                <td colSpan={colCount} className="i-table-c__state">
                  没有数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
