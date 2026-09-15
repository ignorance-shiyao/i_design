/**
 * ProTable：带查询层与列能力的表格（astra.md 的 B04 + B05）。
 *
 * 组件不发请求：它把「现在该请求什么」抛出去，由页面取数——组件内置请求的话，
 * 取消、重试、鉴权、缓存这些事都得在组件里再实现一遍，而每个项目的做法都不一样。
 *
 * 过期响应的判定在公共层：序号比屏幕上这份旧的会被丢掉，否则乱序返回时
 * 用户看到的是一份对不上当前条件的数据，且没有任何报错。
 *
 * 隐藏列与权限是两件事：列设置只管显示，受权限控制的列由 restricted 标记。
 */
import { useEffect, useState, type ReactNode } from 'react'
import {
  DENSITY_ROW_HEIGHT,
  defaultColumnState,
  fixColumn,
  pageCount,
  resetColumns,
  resolveTableColumns,
  setDensity,
  setPage,
  setPageSize,
  setSort,
  toggleColumn,
  type ColumnSpec,
  type ColumnState,
  type TableDensity,
  type TableQuery,
  type TableState
} from '@i-design/common'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { Icon } from './Icon'
import { Pagination } from './Pagination'
import { Segmented } from './Segmented'

type Row = Record<string, unknown>

export interface ProTableProps {
  columns: ColumnSpec[]
  /** 查询层状态。由页面持有，组件只读它并抛出「该请求什么」 */
  state: TableState<Row>
  /** 列设置。不传则组件自己维护一份内部状态 */
  columnState?: ColumnState | null
  rowKey?: string
  /** 可视宽度，用来判断固定列是否已经占满。窄屏上这个值要小 */
  viewportWidth?: number
  emptyText?: string
  /** 该请求什么了。页面拿去取数，回来后用 receive() 落地 */
  onRequest?: (query: TableQuery) => void
  onColumnStateChange?: (state: ColumnState) => void
  /** 单元格渲染：键是列 key */
  cell?: Record<string, (row: Row, value: unknown) => ReactNode>
  className?: string
}

const densities: { label: string; value: TableDensity }[] = [
  { label: '紧凑', value: 'compact' },
  { label: '默认', value: 'default' },
  { label: '宽松', value: 'loose' }
]

export function ProTable({
  columns,
  state,
  columnState = null,
  rowKey = 'id',
  viewportWidth = 960,
  emptyText = '没有符合条件的数据',
  onRequest,
  onColumnStateChange,
  cell = {},
  className = ''
}: ProTableProps) {
  const [inner, setInner] = useState<ColumnState>(() => defaultColumnState(columns))
  const [panel, setPanel] = useState(false)
  /* 固定列被拒时的说明。不说的话，用户只会觉得「点了没反应」 */
  const [rejected, setRejected] = useState('')

  const current = columnState ?? inner
  const setColumnState = (next: ColumnState) => {
    setInner(next)
    setRejected('')
    onColumnStateChange?.(next)
  }

  useEffect(() => setRejected(''), [current])

  const resolved = resolveTableColumns(columns, current)
  const shown = resolved.filter((c) => !c.hidden)
  const rowHeight = DENSITY_ROW_HEIGHT[current.density]
  const totalPages = pageCount(state.total, state.query.pageSize)

  const ask = (next: TableState<Row>) => onRequest?.(next.query)

  /** 未排序时用最淡的一档「更多」而不是上下箭头：箭头会被读成「已经排过了」 */
  const sortIcon = (key: string) => {
    if (state.query.sort.key !== key) return 'more' as const
    return state.query.sort.order === 'asc' ? ('chevron-up' as const) : ('chevron-down' as const)
  }

  /** 固定列的左偏移：按它前面那些固定列的宽度累加 */
  const fixedOffset = (index: number) =>
    shown
      .slice(0, index)
      .filter((c) => c.fixed === 'left')
      .reduce((sum, c) => sum + (Number.parseFloat(c.width ?? '') || 160), 0)

  return (
    <section className={['i-pro-table', className].filter(Boolean).join(' ')}>
      <div className="i-pro-table__bar">
        <span className="i-pro-table__count">
          共 {state.total} 条
          {/* 还有请求在路上时明说，而不是让用户对着一份旧数据以为是新的 */}
          {state.status === 'loading' && <span className="i-pro-table__stale">（正在更新…）</span>}
        </span>
        <div className="i-pro-table__tools">
          <Segmented
            value={current.density}
            options={densities}
            onChange={(v) => setColumnState(setDensity(current, v as TableDensity))}
          />
          <Button size="sm" aria-expanded={panel} onClick={() => setPanel(!panel)}>
            <Icon name="layers" size={14} /> 列设置
          </Button>
        </div>
      </div>

      {/* 列设置面板：显隐、固定、恢复默认。恢复默认这个出口必须一直在 */}
      {panel && (
        <div className="i-pro-table__panel">
          {resolved.map((column) => (
            <div className="i-pro-table__panel-row" key={column.key}>
              <Checkbox
                checked={!column.hidden}
                disabled={column.locked}
                onChange={() => setColumnState(toggleColumn(current, column.key, columns))}
              >
                {column.title}
                {column.locked && <span className="i-pro-table__hint">（主键不可隐藏）</span>}
                {!column.locked && column.restricted && (
                  <span className="i-pro-table__hint">（受权限控制）</span>
                )}
              </Checkbox>
              <button
                type="button"
                className="i-pro-table__fix"
                aria-pressed={column.fixed === 'left'}
                onClick={() => {
                  const result = fixColumn(
                    current,
                    column.key,
                    column.fixed === 'left' ? null : 'left',
                    { viewportWidth }
                  )
                  if (result.rejected) setRejected(result.rejected)
                  else setColumnState(result.state)
                }}
              >
                {column.fixed === 'left' ? '取消固定' : '固定在左'}
              </button>
            </div>
          ))}
          {rejected && (
            <p className="i-pro-table__rejected" role="status">{rejected}</p>
          )}
          <Button size="sm" onClick={() => setColumnState(resetColumns(columns))}>恢复默认</Button>
        </div>
      )}

      <div className="i-pro-table__scroll">
        <table
          className="i-pro-table__table"
          style={{ ['--i-pro-row-height' as string]: `${rowHeight}px` }}
        >
          <thead>
            <tr>
              {shown.map((column, index) => (
                <th
                  key={column.key}
                  className={column.fixed === 'left' ? 'is-fixed' : undefined}
                  style={
                    column.fixed === 'left'
                      ? { left: fixedOffset(index), width: column.width }
                      : { width: column.width }
                  }
                  aria-sort={
                    state.query.sort.key === column.key
                      ? state.query.sort.order === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="i-pro-table__sort"
                      onClick={() => ask(setSort(state, column.key))}
                    >
                      {column.title}
                      <Icon name={sortIcon(column.key)} size={12} />
                    </button>
                  ) : (
                    column.title
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.rows.map((row, rowIndex) => (
              <tr key={String(row[rowKey] ?? rowIndex)}>
                {shown.map((column, index) => (
                  <td
                    key={column.key}
                    className={column.fixed === 'left' ? 'is-fixed' : undefined}
                    style={column.fixed === 'left' ? { left: fixedOffset(index) } : undefined}
                  >
                    {cell[column.key]
                      ? cell[column.key](row, row[column.key])
                      : (row[column.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
            {!state.rows.length && (
              <tr>
                <td colSpan={shown.length} className="i-pro-table__empty">
                  {state.status === 'error' ? state.error : emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="i-pro-table__foot">
        <Pagination
          total={state.total}
          current={state.query.page}
          pageSize={state.query.pageSize}
          onChange={(page) => ask(setPage(state, page))}
        />
        <label className="i-pro-table__size">
          每页
          <select
            value={state.query.pageSize}
            onChange={(e) => ask(setPageSize(state, Number(e.target.value)))}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          条，共 {totalPages} 页
        </label>
      </div>
    </section>
  )
}
