import { describe, expect, it } from 'vitest'
import type { FilterField, QueryState, QuickFilter } from '../contracts/query'
import {
  DEFAULT_PAGE_SIZE,
  activeCount,
  applyQuickFilter,
  changeFilter,
  clearFilters,
  fromSearch,
  matchQuickFilter,
  parseQuery,
  serializeQuery,
  toSearch
} from './query'

const fields: FilterField[] = [
  { name: 'keyword', label: '关键词', kind: 'text' },
  {
    name: 'status',
    label: '状态',
    kind: 'select',
    options: [
      { value: 'open', label: '进行中' },
      { value: 'done', label: '已完成' }
    ]
  },
  {
    name: 'tags',
    label: '标签',
    kind: 'multi-select',
    options: [
      { value: 'vip', label: 'VIP' },
      { value: 'new', label: '新客' }
    ]
  },
  { name: 'created', label: '创建时间', kind: 'date-range' },
  { name: 'amount', label: '金额', kind: 'number-range' }
]

const base: QueryState = { values: {}, page: 3, pageSize: DEFAULT_PAGE_SIZE }

describe('条件变更', () => {
  it('条件一变就回第一页——否则用户看到的是空白的第 3 页', () => {
    expect(changeFilter(base, 'keyword', '订单').page).toBe(1)
  })

  it('把同一个值再选一遍不打断翻页', () => {
    const state = { ...base, values: { status: 'open' } }
    expect(changeFilter(state, 'status', 'open').page).toBe(3)
  })

  it('清空某个条件等于把它删掉，而不是留一个空值', () => {
    const state = { ...base, values: { keyword: '订单' } }
    expect(changeFilter(state, 'keyword', '').values).toEqual({})
  })

  it('清空全部保留每页条数——那是显示偏好，不是筛选条件', () => {
    const state: QueryState = { values: { keyword: 'x' }, page: 5, pageSize: 50 }
    expect(clearFilters(state)).toEqual({ values: {}, page: 1, pageSize: 50 })
  })

  it('有几个条件生效数得出来，空值不算', () => {
    expect(activeCount({ a: 'x', b: '', c: [], d: { from: '2024-01-01' } })).toBe(2)
  })
})

describe('快捷筛选', () => {
  const quick: QuickFilter = { key: 'mine', label: '我的进行中', values: { status: 'open' } }

  it('整套替换当前条件，而不是叠加', () => {
    const state = { ...base, values: { keyword: '旧的', tags: ['vip'] } }
    expect(applyQuickFilter(state, quick).values).toEqual({ status: 'open' })
  })

  it('应用后回第一页', () => {
    expect(applyQuickFilter(base, quick).page).toBe(1)
  })

  it('当前条件正好等于它时认得出来，用来显示选中态', () => {
    expect(matchQuickFilter({ status: 'open' }, quick)).toBe(true)
    expect(matchQuickFilter({ status: 'open', keyword: 'x' }, quick)).toBe(false)
  })
})

describe('参数往返', () => {
  it('同一组条件每次序列化出来都一样——顺序不稳会让后退不听话', () => {
    const a = serializeQuery({ values: { status: 'open', keyword: 'x' }, page: 1, pageSize: 20 }, fields)
    const b = serializeQuery({ values: { keyword: 'x', status: 'open' }, page: 1, pageSize: 20 }, fields)
    expect(Object.keys(a)).toEqual(Object.keys(b))
    expect(toSearch(a)).toBe(toSearch(b))
  })

  it('往返无损：条件出去再回来还是同一份', () => {
    const state: QueryState = {
      values: {
        keyword: '订单',
        status: 'done',
        tags: ['vip', 'new'],
        created: { from: '2024-01-01', to: '2024-03-31' },
        amount: { from: '100' }
      },
      page: 4,
      pageSize: 50
    }
    const back = parseQuery(fromSearch(toSearch(serializeQuery(state, fields))), fields)
    expect(back.invalid).toEqual([])
    expect(back.state).toEqual(state)
  })

  it('第一页与默认页长不进参数：它们是默认值', () => {
    expect(serializeQuery({ values: {}, page: 1, pageSize: DEFAULT_PAGE_SIZE }, fields)).toEqual({})
  })

  it('空条件不进参数，链接里不留 ?status=', () => {
    expect(serializeQuery({ values: { status: '' }, page: 1, pageSize: 20 }, fields)).toEqual({})
  })

  it('没有任何参数时不留一个光秃秃的问号', () => {
    expect(toSearch({})).toBe('')
  })
})

describe('无效参数', () => {
  it('已经下线的枚举值退回默认并说出来，而不是静默丢掉', () => {
    const r = parseQuery({ status: 'archived' }, fields)
    expect(r.state.values.status).toBeUndefined()
    expect(r.invalid[0].reason).toMatch(/没有这个取值/)
  })

  it('多选里只有一部分无效时，好的留下、坏的报出来', () => {
    const r = parseQuery({ tags: 'vip,ghost' }, fields)
    expect(r.state.values.tags).toEqual(['vip'])
    expect(r.invalid[0].raw).toBe('ghost')
  })

  it('改版删掉的筛选项要点名，而不是当没看见', () => {
    const r = parseQuery({ removedField: 'x' }, fields)
    expect(r.invalid[0].reason).toMatch(/已经不存在/)
  })

  it('开始晚于结束时报错，且不替用户对调——对调会掩盖他填错了位置', () => {
    const r = parseQuery({ created: '2024-05-01~2024-01-01' }, fields)
    expect(r.state.values.created).toBeUndefined()
    expect(r.invalid[0].reason).toMatch(/开始晚于结束/)
  })

  it('数字范围里写了非数字要报出来', () => {
    expect(parseQuery({ amount: 'abc~100' }, fields).invalid[0].reason).toMatch(/不是数字/)
  })

  it('单边范围是合法的', () => {
    expect(parseQuery({ created: '2024-01-01~' }, fields).state.values.created).toEqual({
      from: '2024-01-01'
    })
  })

  it('页码不是正整数时退回第一页并说出来', () => {
    const r = parseQuery({ page: '0' }, fields)
    expect(r.state.page).toBe(1)
    expect(r.invalid[0].reason).toMatch(/正整数/)
  })

  it('页码是小数也不认', () => {
    expect(parseQuery({ page: '2.5' }, fields).invalid[0].name).toBe('page')
  })

  it('全是好参数时不报任何问题', () => {
    expect(parseQuery({ status: 'open', page: '2' }, fields).invalid).toEqual([])
  })
})
