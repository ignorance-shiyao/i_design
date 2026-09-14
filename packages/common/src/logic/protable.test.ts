import { describe, expect, it } from 'vitest'
import {
  cancel,
  clampTablePage,
  fail,
  initialTableState,
  isStale,
  pageCount,
  receive,
  setFilters,
  setPage,
  setPageSize,
  setSort,
  startRequest,
  toggleSort
} from './protable'

interface Row {
  id: string
}

const rows = (...ids: string[]): Row[] => ids.map((id) => ({ id }))

describe('排序三态', () => {
  it('同一列点三下：升 → 降 → 取消，用户要能回到原始顺序', () => {
    let sort = toggleSort({ key: null, order: null }, 'name')
    expect(sort).toEqual({ key: 'name', order: 'asc' })
    sort = toggleSort(sort, 'name')
    expect(sort).toEqual({ key: 'name', order: 'desc' })
    sort = toggleSort(sort, 'name')
    expect(sort).toEqual({ key: null, order: null })
  })

  it('换一列从升序开始', () => {
    expect(toggleSort({ key: 'a', order: 'desc' }, 'b')).toEqual({ key: 'b', order: 'asc' })
  })

  it('取消排序时把 key 也清掉——留着会让下次出现两列都有排序标记', () => {
    expect(toggleSort({ key: 'a', order: 'desc' }, 'a').key).toBeNull()
  })
})

describe('过期响应', () => {
  it('先发后到的旧响应被丢掉，不覆盖新结果', () => {
    const a = startRequest(initialTableState<Row>())
    const b = startRequest(a.state)
    // 第二个请求先回来
    let state = receive(b.state, { seq: b.request.seq, rows: rows('new'), total: 1 })
    expect(state.rows.map((r) => r.id)).toEqual(['new'])
    // 第一个请求姗姗来迟
    state = receive(state, { seq: a.request.seq, rows: rows('old'), total: 99 })
    expect(state.rows.map((r) => r.id)).toEqual(['new'])
    expect(state.total).toBe(1)
  })

  it('被丢掉的响应记下来——「点了没反应」要能排查', () => {
    const a = startRequest(initialTableState<Row>())
    const b = startRequest(a.state)
    let state = receive(b.state, { seq: 2, rows: rows('new'), total: 1 })
    state = receive(state, { seq: 1, rows: rows('old'), total: 9 })
    expect(state.discarded).toEqual([1])
  })

  it('中间的响应也能落地，只要它比屏幕上这份新——否则网络抖动时用户盯着空表等', () => {
    let state = initialTableState<Row>()
    const a = startRequest(state)
    const b = startRequest(a.state)
    const c = startRequest(b.state)
    state = receive(c.state, { seq: b.request.seq, rows: rows('mid'), total: 5 })
    expect(state.rows.map((r) => r.id)).toEqual(['mid'])
    // 还有更新的请求在路上，状态仍是 loading
    expect(state.status).toBe('loading')
    expect(isStale(state)).toBe(true)
  })

  it('最新的响应落地后状态才是 success', () => {
    const a = startRequest(initialTableState<Row>())
    const state = receive(a.state, { seq: a.request.seq, rows: rows('x'), total: 1 })
    expect(state.status).toBe('success')
    expect(isStale(state)).toBe(false)
  })

  it('过期请求的失败不抹掉当前这屏数据', () => {
    const a = startRequest(initialTableState<Row>())
    const b = startRequest(a.state)
    let state = receive(b.state, { seq: 2, rows: rows('good'), total: 1 })
    state = fail(state, 1, '超时')
    expect(state.status).toBe('success')
    expect(state.rows.map((r) => r.id)).toEqual(['good'])
    expect(state.error).toBeNull()
  })

  it('当前请求失败时才报错', () => {
    const a = startRequest(initialTableState<Row>())
    const state = fail(a.state, a.request.seq, '服务异常')
    expect(state.status).toBe('error')
    expect(state.error).toBe('服务异常')
  })

  it('取消不改数据：屏幕上那份仍然有效', () => {
    const a = startRequest(initialTableState<Row>())
    let state = receive(a.state, { seq: 1, rows: rows('x'), total: 1 })
    const b = startRequest(state)
    state = cancel(b.state)
    expect(state.rows.map((r) => r.id)).toEqual(['x'])
    expect(state.status).toBe('success')
  })
})

describe('条件与分页', () => {
  const base = setPage(initialTableState<Row>(), 3)

  it('筛选真的变了才回第一页', () => {
    expect(setFilters(base, { status: 'open' }).query.page).toBe(1)
    const same = setFilters(setFilters(base, { status: 'open' }), { status: 'open' })
    expect(same.query.page).toBe(1)
  })

  it('同一组条件再设一次不打断翻页', () => {
    const withFilter = setPage(setFilters(base, { status: 'open' }), 5)
    expect(setFilters(withFilter, { status: 'open' }).query.page).toBe(5)
  })

  it('排序一定回第一页——排序变了之后「第 3 页」不是同一批行', () => {
    expect(setSort(base, 'name').query.page).toBe(1)
  })

  it('改每页条数回第一页', () => {
    expect(setPageSize(base, 100).query.page).toBe(1)
  })

  it('翻页只改页码，不碰筛选与排序', () => {
    const state = setSort(setFilters(base, { a: 'b' }), 'name')
    const next = setPage(state, 4)
    expect(next.query.filters).toEqual({ a: 'b' })
    expect(next.query.sort.key).toBe('name')
  })

  it('页码不接受 0 与小数', () => {
    expect(setPage(base, 0).query.page).toBe(1)
    expect(setPage(base, 2.7).query.page).toBe(2)
  })

  it('总数变少后当前页超出时退回最后一页，而不是显示空白', () => {
    let state = setPage(initialTableState<Row>(), 5)
    state = receive(startRequest(state).state, { seq: 1, rows: rows('a'), total: 21 })
    expect(clampTablePage(state).query.page).toBe(2)
  })

  it('总数为 0 时最后一页是第 1 页', () => {
    expect(pageCount(0, 20)).toBe(1)
  })
})
