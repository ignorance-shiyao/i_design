import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  nextSortOrder,
  rafThrottle,
  shouldVirtualize,
  sortRows,
  virtualWindow,
  type SortOrder
} from '@i-design/common'
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
  /** 开启行选择：多选场景下的批量操作靠它 */
  selectable?: boolean
  /** 已选行的 rowKey 值 */
  selected?: (string | number)[]
  /**
   * 表体高度，如 `360px`。给了之后表头吸顶、表体自己滚，行多时只渲染看得见的那几行。
   * 不给时整张表平铺，由外层页面滚动。
   */
  height?: string
  onSelectedChange?: (selected: (string | number)[]) => void
}

/** 行高实测不到时的兜底。主题面板能调字号与间距，所以不写死 */
const ROW_FALLBACK_HEIGHT = 44

export function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  size = 'md',
  striped = false,
  loading = false,
  emptyText = '暂无数据',
  selectable = false,
  selected = [],
  height = '',
  onSelectedChange
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [order, setOrder] = useState<SortOrder>(null)

  // 三态循环与比较规则来自公共层，Vue 端改排序逻辑这里自动跟随
  const rows = sortRows(data, sortKey, order)

  /* ----------------------------------------------------------- 虚拟滚动 */

  /*
   * 只有给了 height 才虚拟化：没有可视高度就算不出该渲染哪几行，
   * 拿一个猜的高度去算会把行定位到看不见的地方，比不虚拟化更糟。
   */
  const wrap = useRef<HTMLDivElement | null>(null)
  const [rowHeight, setRowHeight] = useState(ROW_FALLBACK_HEIGHT)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const virtual = Boolean(height) && shouldVirtualize(rows.length)
  const win = virtualWindow(scrollTop, viewportHeight, rowHeight, rows.length)
  const visible = useMemo(() => {
    if (!virtual) return rows.map((row, index) => ({ row, index }))
    const out: { row: T; index: number }[] = []
    for (let i = win.start; i <= win.end; i++) out.push({ row: rows[i], index: i })
    return out
  }, [virtual, rows, win.start, win.end])

  /* 滚动事件远多于帧，而每次都要读一次布局 */
  const onScroll = useMemo(
    () =>
      rafThrottle(() => {
        if (wrap.current) setScrollTop(wrap.current.scrollTop)
      }),
    []
  )
  useEffect(() => () => onScroll.cancel(), [onScroll])

  const measure = useCallback(() => {
    const el = wrap.current
    if (!el) return
    setViewportHeight(el.clientHeight)
    const first = el.querySelector<HTMLElement>('tbody tr:not(.i-table-c__spacer)')
    if (first && first.offsetHeight > 0) setRowHeight(first.offsetHeight)
  }, [])

  useLayoutEffect(measure, [measure, height, rows.length])

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

  const keyOf = (row: T) => row[rowKey] as string | number
  const isChecked = (row: T) => selected.includes(keyOf(row))

  /*
   * 全选只作用于当前这一页的数据，而不是整份数据源。
   * 分页表格里「全选」若悄悄勾上没显示出来的行，用户点下删除时删掉的
   * 远比他看到的多——最典型的一种误操作，代价还不可逆。
   */
  const allKeys = rows.map(keyOf)
  const allChecked = allKeys.length > 0 && allKeys.every((k) => selected.includes(k))
  // 半选：部分勾选时表头必须是第三种状态，否则看上去像「一个都没选」
  const someChecked = !allChecked && allKeys.some((k) => selected.includes(k))

  const toggleRow = (row: T) => {
    const key = keyOf(row)
    onSelectedChange?.(isChecked(row) ? selected.filter((k) => k !== key) : [...selected, key])
  }

  const toggleAll = () => {
    if (allChecked) {
      onSelectedChange?.(selected.filter((k) => !allKeys.includes(k)))
      return
    }
    // 合并而不是覆盖：其他页选中的行不该因为这一页全选而丢掉
    const next = new Set(selected)
    allKeys.forEach((k) => next.add(k))
    onSelectedChange?.([...next])
  }

  const ariaSort = (column: TableColumn<T>) => {
    if (!column.sortable) return undefined
    if (sortKey !== column.key || !order) return 'none' as const
    return order === 'asc' ? ('ascending' as const) : ('descending' as const)
  }

  return (
    <div
      ref={wrap}
      className={['i-table-wrap', height ? 'is-scrollable' : ''].filter(Boolean).join(' ')}
      style={{ height: height || undefined }}
      onScroll={onScroll}
    >
      <table
        className={['i-table-c', `i-table-c--${size}`, striped ? 'is-striped' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <thead>
          <tr>
            {selectable && (
              <th className="i-table-c__check-cell">
                <input
                  type="checkbox"
                  className="i-table-c__check"
                  aria-label="全选本页"
                  checked={allChecked}
                  ref={(el) => {
                    // 半选态只能用 DOM 属性设置，React 没有对应的受控 prop
                    if (el) el.indeterminate = someChecked
                  }}
                  onChange={toggleAll}
                />
              </th>
            )}
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
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="i-table-c__state">加载中…</td>
            </tr>
          ) : !rows.length ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="i-table-c__state">{emptyText}</td>
            </tr>
          ) : (
            <>
              {/* 上下两行空白替代没渲染的那些行，滚动条长度才和真实行数相称 */}
              {virtual && (
                <tr className="i-table-c__spacer" aria-hidden="true">
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    style={{ height: win.paddingTop }}
                  />
                </tr>
              )}
              {visible.map(({ row, index }) => (
              <tr
                key={String(row[rowKey] ?? index)}
                className={selectable && isChecked(row) ? 'is-selected' : undefined}
              >
                {selectable && (
                  <td className="i-table-c__check-cell">
                    <input
                      type="checkbox"
                      className="i-table-c__check"
                      aria-label={`选择第 ${index + 1} 行`}
                      checked={isChecked(row)}
                      onChange={() => toggleRow(row)}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                    {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
              ))}
              {virtual && (
                <tr className="i-table-c__spacer" aria-hidden="true">
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    style={{ height: win.paddingBottom }}
                  />
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
