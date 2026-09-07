import { useState } from 'react'
import { nextSortOrder, sortRows, type SortOrder } from '@i-design/common'
import type { ReactNode } from 'react'

export interface TableColumn<T = any> {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  /** 自定义单元格，等价于 Vue 端的同名插槽 */
  render?: (value: any, row: T, index: number) => ReactNode
}

export interface TableProps<T extends Record<string, any> = any> {
  columns: TableColumn<T>[]
  data: T[]
  rowKey?: string
  size?: 'sm' | 'md'
  striped?: boolean
  loading?: boolean
  emptyText?: string
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  size = 'md',
  striped = false,
  loading = false,
  emptyText = '暂无数据'
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [order, setOrder] = useState<SortOrder>(null)

  // 三态循环与比较规则来自公共层，Vue 端改排序逻辑这里自动跟随
  const rows = sortRows(data, sortKey, order)

  const toggle = (column: TableColumn<T>) => {
    if (!column.sortable) return
    if (sortKey !== column.key) {
      setSortKey(column.key)
      setOrder('asc')
      return
    }
    const next = nextSortOrder(order)
    setOrder(next)
    if (next === null) setSortKey(null)
  }

  const ariaSort = (column: TableColumn<T>) => {
    if (!column.sortable) return undefined
    if (sortKey !== column.key || !order) return 'none' as const
    return order === 'asc' ? ('ascending' as const) : ('descending' as const)
  }

  return (
    <div className="i-table-wrap">
      <table
        className={['i-table-c', `i-table-c--${size}`, striped ? 'is-striped' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width, textAlign: column.align ?? 'left' }}
                className={column.sortable ? 'is-sortable' : undefined}
                aria-sort={ariaSort(column)}
                onClick={() => toggle(column)}
              >
                <span className="i-table-c__th">
                  {column.title}
                  {column.sortable && (
                    <span className="i-table-c__sorter">
                      <i data-dir="up" className={sortKey === column.key && order === 'asc' ? 'is-on' : ''} />
                      <i data-dir="down" className={sortKey === column.key && order === 'desc' ? 'is-on' : ''} />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="i-table-c__state">加载中…</td>
            </tr>
          ) : !rows.length ? (
            <tr>
              <td colSpan={columns.length} className="i-table-c__state">{emptyText}</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={String(row[rowKey] ?? index)}>
                {columns.map((column) => (
                  <td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                    {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
