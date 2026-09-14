/**
 * 图表联动的回归测试。
 *
 * 两条最难在开发时发现、又最难受的路径各有一组用例：
 * 循环联动（页面白屏，日志里只有一串一模一样的更新）与
 * 返回回不去（用户卡在一个既不是上一级也不是当前级的状态里）。
 */
import { describe, expect, it } from 'vitest'
import {
  applySelection, drillPath, drillUp, emptyLinkage, matchesFilters, type SelectionEvent
} from './linkage'

const ev = (event: SelectionEvent) => event

describe('循环联动', () => {
  it('一张图把自己的选择原样发回来时被忽略', () => {
    const state = applySelection(emptyLinkage('region'), ev({ source: 'pie', kind: 'filter', field: 'region', values: ['华东'] }))
    // 这一轮的发起者是 pie；pie 因为重渲染又发了一次同样的事件
    const again = applySelection(state, ev({ source: 'pie', kind: 'filter', field: 'region', values: ['华东'] }), 'pie')
    expect(again.filters).toEqual(state.filters)
    expect(again.ignored).toEqual([{ source: 'pie', reason: 'same-source' }])
  })

  it('别的图发来的同一个条件照常处理——那不是回声，是另一张图的真实交互', () => {
    const state = applySelection(emptyLinkage('region'), ev({ source: 'pie', kind: 'filter', field: 'region', values: ['华东'] }))
    const fromTable = applySelection(state, ev({ source: 'table', kind: 'filter', field: 'region', values: ['华东'] }), 'pie')
    // 同一个条件再来一次等于取消，这是列表与图表都通行的约定
    expect(fromTable.filters).toEqual([])
  })
})

describe('筛选', () => {
  it('同一个字段的新条件替换旧的，不叠加', () => {
    let state = emptyLinkage('region')
    state = applySelection(state, ev({ source: 'a', kind: 'filter', field: 'region', values: ['华东'] }))
    state = applySelection(state, ev({ source: 'a', kind: 'filter', field: 'region', values: ['华南'] }))
    expect(state.filters).toEqual([{ field: 'region', values: ['华南'], range: undefined }])
  })

  it('刷选带的是区间，与按值筛选共存于不同字段', () => {
    let state = emptyLinkage('date')
    state = applySelection(state, ev({ source: 'line', kind: 'brush', field: 'date', range: [1, 5] }))
    state = applySelection(state, ev({ source: 'pie', kind: 'filter', field: 'region', values: ['华东'] }))
    expect(state.filters).toHaveLength(2)
  })

  it('清空只清筛选，不退出下钻——那是两个动作', () => {
    let state = emptyLinkage('region')
    state = applySelection(state, ev({ source: 'bar', kind: 'drill', field: 'region', values: ['华东'], into: 'city' }))
    state = applySelection(state, ev({ source: 'bar', kind: 'clear' }))
    expect(state.filters).toEqual([])
    expect(state.stack).toHaveLength(1)
    expect(state.dimension).toBe('city')
  })
})

describe('下钻与返回', () => {
  it('返回恢复的是「进入这一级之前」的整套筛选，而不是逐条回滚', () => {
    let state = emptyLinkage('region')
    state = applySelection(state, ev({ source: 'q', kind: 'filter', field: 'channel', values: ['直销'] }))
    const before = state.filters
    state = applySelection(state, ev({ source: 'bar', kind: 'drill', field: 'region', values: ['华东'], into: 'city' }))
    // 下钻之后又改了筛选——返回时这些改动不该留下来
    state = applySelection(state, ev({ source: 'q', kind: 'filter', field: 'sku', values: ['HX-1001'] }))
    expect(state.filters).toHaveLength(3)

    const back = drillUp(state, 'region')
    expect(back.filters).toEqual(before)
    expect(back.dimension).toBe('region')
    expect(back.stack).toEqual([])
  })

  it('多级下钻逐级返回，面包屑说得清现在在哪一级', () => {
    let state = emptyLinkage('region')
    state = applySelection(state, ev({ source: 'bar', kind: 'drill', field: 'region', values: ['华东'], into: 'city' }))
    state = applySelection(state, ev({ source: 'bar', kind: 'drill', field: 'city', values: ['杭州'], into: 'store' }))
    expect(drillPath(state)).toEqual(['全部', '华东', '杭州'])
    expect(state.dimension).toBe('store')

    state = drillUp(state, 'region')
    expect(state.dimension).toBe('region')
    expect(drillPath(state)).toEqual(['全部', '华东'])
  })

  it('在顶层点返回不出错，也不清空筛选', () => {
    const state = applySelection(emptyLinkage('region'), ev({ source: 'q', kind: 'filter', field: 'channel', values: ['直销'] }))
    expect(drillUp(state, 'region')).toBe(state)
  })

  it('先筛某个值再从它下钻时，同一个字段只留一条筛选', () => {
    let state = emptyLinkage('region')
    state = applySelection(state, ev({ source: 'bar', kind: 'filter', field: 'region', values: ['华东'] }))
    state = applySelection(state, ev({ source: 'bar', kind: 'drill', field: 'region', values: ['华东'], into: 'city' }))
    // 重复条件不会改变结果，但会原样出现在筛选摘要里，读者以为自己点错了什么
    expect(state.filters).toEqual([{ field: 'region', values: ['华东'] }])
  })

  it('缺少必要字段的下钻被忽略并记账，而不是压进一个空层', () => {
    const state = applySelection(emptyLinkage('region'), ev({ source: 'bar', kind: 'drill', field: 'region', values: [] }))
    expect(state.stack).toEqual([])
    expect(state.ignored).toEqual([{ source: 'bar', reason: 'noop' }])
  })
})

describe('筛选命中', () => {
  const rows = [
    { region: '华东', amount: 120 },
    { region: '华南', amount: 60 },
    { region: null, amount: 90 }
  ]

  it('按值与按区间都能命中，图与表共用同一套口径', () => {
    expect(rows.filter((r) => matchesFilters(r, [{ field: 'region', values: ['华东'] }]))).toHaveLength(1)
    expect(rows.filter((r) => matchesFilters(r, [{ field: 'amount', range: [80, 130] }]))).toHaveLength(2)
  })

  it('维度为空的行不会被「选了华东」顺手带进来', () => {
    expect(matchesFilters(rows[2], [{ field: 'region', values: ['华东'] }])).toBe(false)
  })
})
