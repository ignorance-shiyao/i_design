/**
 * ProTable 查询层的状态机（astra.md 的 B04）。
 *
 * 五端共用。四件事定死在这里：
 *
 * 1. **过期响应必须丢掉。** 请求带序号，响应回来时序号小于已落地的就丢弃，
 *    并记进 discarded。不丢的话，先发后到的旧结果会覆盖新结果，
 *    界面上是一份看起来正常、实际对不上当前条件的数据，且没有任何报错。
 * 2. **条件变了就回第一页。** 与 QueryFilter 同一条规则，理由也一样：
 *    改完筛选看到空白的第 7 页，用户会以为没有数据。
 * 3. **翻页不回第一页，排序回。** 排序变了之后「第 3 页」指的已经不是同一批行。
 * 4. **总数与行同源。** total 跟着 rows 一起从同一个响应里取，
 *    分两次请求会让最后一页变空白。
 */
import type {
  RequestStatus,
  SortState,
  TableQuery,
  TableRequest,
  TableResult,
  TableState
} from '../contracts/protable'
import type { FilterValues } from '../contracts/query'
import type { SortOrder } from './table'

// 页长默认值与 QueryFilter 共用一份：两处各写一个 20，改一处就会对不上
import { DEFAULT_PAGE_SIZE } from './query'

export { DEFAULT_PAGE_SIZE }

export function initialTableState<T>(query?: Partial<TableQuery>): TableState<T> {
  return {
    query: {
      filters: {},
      sort: { key: null, order: null },
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      ...query
    },
    rows: [],
    total: 0,
    status: 'idle',
    seq: 0,
    settledSeq: 0,
    error: null,
    discarded: []
  }
}

/** 点一次表头：升序 → 降序 → 取消排序。三态而不是两态，用户要能回到原始顺序 */
export const nextOrder = (order: SortOrder): SortOrder =>
  order === 'asc' ? 'desc' : order === 'desc' ? null : 'asc'

export function toggleSort(sort: SortState, key: string): SortState {
  if (sort.key !== key) return { key, order: 'asc' }
  const order = nextOrder(sort.order)
  // 取消排序时把 key 也清掉：留着一个 order 为 null 的 key，
  // 下次点别的列时会短暂出现「两列都有排序标记」
  return order ? { key, order } : { key: null, order: null }
}

/** 发一次请求：序号加一，状态进 loading。返回新状态与该带上的请求参数 */
export function startRequest<T>(state: TableState<T>): { state: TableState<T>; request: TableRequest } {
  const seq = state.seq + 1
  return {
    state: { ...state, seq, status: 'loading', error: null },
    request: { ...state.query, seq }
  }
}

/**
 * 响应落地。序号不是最新的就丢掉并记下来。
 *
 * 判据是「比已落地的新」而不是「等于当前最大序号」：中间的响应也可以落地，
 * 只要它比屏幕上这份新——否则网络抖动时用户会盯着一个空表等最后那个请求。
 */
export function receive<T>(state: TableState<T>, result: TableResult<T>): TableState<T> {
  if (result.seq <= state.settledSeq) {
    return { ...state, discarded: [...state.discarded, result.seq] }
  }
  return {
    ...state,
    rows: result.rows,
    // 总数与行同源：分两次请求取会让最后一页变成空白
    total: result.total,
    settledSeq: result.seq,
    status: result.seq === state.seq ? 'success' : 'loading',
    error: null
  }
}

/** 请求失败。同样要判序号：过期请求的失败不该把当前这屏数据抹掉 */
export function fail<T>(state: TableState<T>, seq: number, message: string): TableState<T> {
  if (seq <= state.settledSeq || seq < state.seq) {
    return { ...state, discarded: [...state.discarded, seq] }
  }
  return { ...state, status: 'error', error: message, settledSeq: seq }
}

/** 用户主动取消：不改数据，只把状态落回去，屏幕上那份仍然有效 */
export function cancel<T>(state: TableState<T>): TableState<T> {
  return { ...state, status: state.settledSeq ? 'success' : 'idle', seq: state.seq }
}

const sameFilters = (a: FilterValues, b: FilterValues) => JSON.stringify(a) === JSON.stringify(b)

/** 改筛选：条件真的变了才回第一页，把同一个条件再选一遍不该打断翻页 */
export function setFilters<T>(state: TableState<T>, filters: FilterValues): TableState<T> {
  const changed = !sameFilters(state.query.filters, filters)
  return { ...state, query: { ...state.query, filters, page: changed ? 1 : state.query.page } }
}

/** 改排序：一定回第一页——排序变了之后「第 3 页」指的已经不是同一批行 */
export function setSort<T>(state: TableState<T>, key: string): TableState<T> {
  return { ...state, query: { ...state.query, sort: toggleSort(state.query.sort, key), page: 1 } }
}

/** 翻页：只改页码，不碰其它条件 */
export function setPage<T>(state: TableState<T>, page: number): TableState<T> {
  return { ...state, query: { ...state.query, page: Math.max(1, Math.floor(page)) } }
}

/** 改每页条数：回第一页。第 7 页在每页 20 与每页 100 下指的不是同一批行 */
export function setPageSize<T>(state: TableState<T>, pageSize: number): TableState<T> {
  return { ...state, query: { ...state.query, pageSize: Math.max(1, Math.floor(pageSize)), page: 1 } }
}

export const pageCount = (total: number, pageSize: number) =>
  Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

/**
 * 当前页超出总页数时退回最后一页。
 *
 * 删掉最后一页的最后一条之后就会发生。这时要退回最后一页而不是显示空白——
 * 空白页让用户以为数据没了。
 */
export function clampTablePage<T>(state: TableState<T>): TableState<T> {
  const max = pageCount(state.total, state.query.pageSize)
  return state.query.page > max ? setPage(state, max) : state
}

/** 是否还有请求在路上：loading 且已落地的不是最新的 */
export const isStale = <T>(state: TableState<T>): boolean =>
  state.status === 'loading' && state.settledSeq < state.seq

export const statusOf = <T>(state: TableState<T>): RequestStatus => state.status
