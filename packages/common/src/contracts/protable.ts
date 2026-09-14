/**
 * ProTable 的查询契约（astra.md 的 B04）。
 *
 * 表格的难点从来不在渲染，而在「我现在看到的这一屏，是不是我最后一次请求的结果」。
 * 用户连点三次排序、又改了筛选，三个请求乱序回来——先到的旧响应把新结果覆盖掉，
 * 界面上是一份看起来完全正常、实际上对不上当前条件的数据。没有任何报错。
 *
 * 所以请求带序号，只有最新那个序号的响应才允许落地；被丢掉的响应要记下来，
 * 否则「为什么点了没反应」无从排查。
 */
import type { FilterValues } from './query'

// 排序方向复用 logic/table 里那一份：表格只该有一种「升/降/不排」的定义
import type { SortOrder } from '../logic/table'

export type { SortOrder }

export interface SortState {
  key: string | null
  order: SortOrder
}

export interface TableQuery {
  filters: FilterValues
  sort: SortState
  page: number
  pageSize: number
}

export interface TableRequest extends TableQuery {
  /** 递增序号。响应回来时用它判断是不是已经过期 */
  seq: number
}

export interface TableResult<T> {
  /** 这批数据属于哪一次请求 */
  seq: number
  rows: T[]
  /**
   * 总数。必须与 rows 出自同一次请求——
   * 分两次请求取「数据」和「总数」的话，翻到最后一页会出现空白页，
   * 而用户只会觉得「这个表坏了」。
   */
  total: number
}

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error' | 'cancelled'

export interface TableState<T> {
  query: TableQuery
  rows: T[]
  total: number
  status: RequestStatus
  /** 已发出的最大序号 */
  seq: number
  /** 已落地的序号；小于 seq 说明还有请求在路上 */
  settledSeq: number
  error: string | null
  /** 被丢弃的过期响应序号，排查「点了没反应」时要看它 */
  discarded: number[]
}
