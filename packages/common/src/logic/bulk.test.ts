/**
 * 批量操作的回归测试。
 *
 * 测的全是「对谁做」与「重试发什么」——这两件事判错的代价是一次谁也收不回的
 * 批量操作，或者让已经成功的那些再执行一次。
 */
import { describe, expect, it } from 'vitest'
import {
  bulkOutcome,
  bulkSelection,
  canEscalate,
  escalateLabel,
  failureIndex,
  mergeOutcome
} from './bulk'

const pageIds = [1, 2, 3]

describe('作用域', () => {
  it('三种作用域给出三句不同的摘要——「全选」这个词本身说不清楚', () => {
    const base = { pageIds, selectedIds: [1], matchedTotal: 8000 }
    const summaries = (['selected', 'page', 'matched'] as const).map(
      (scope) => bulkSelection({ ...base, scope }).summary
    )
    expect(new Set(summaries).size).toBe(3)
    expect(summaries[0]).toContain('已勾选')
    expect(summaries[1]).toContain('当前页')
    expect(summaries[2]).toContain('全部 8000 项')
  })

  it('勾了 1 项但作用域是当前页时，条数按当前页算，不按勾选数', () => {
    const sel = bulkSelection({ scope: 'page', pageIds, selectedIds: [1], matchedTotal: 8000 })
    expect(sel.count).toBe(3)
    expect(sel.ids).toEqual(pageIds)
  })

  it('全部匹配不给 id 名单：前端手里没有这份名单，硬凑只会凑出当前页', () => {
    const sel = bulkSelection({ scope: 'matched', pageIds, selectedIds: [], matchedTotal: 8000 })
    expect(sel.ids).toBeNull()
    expect(sel.count).toBe(8000)
  })

  it('只有全部匹配需要再确认——它会碰到用户没看见过的行', () => {
    const base = { pageIds, selectedIds: [1, 2, 3], matchedTotal: 8000 }
    expect(bulkSelection({ ...base, scope: 'selected' }).needsConfirm).toBe(false)
    expect(bulkSelection({ ...base, scope: 'page' }).needsConfirm).toBe(false)
    expect(bulkSelection({ ...base, scope: 'matched' }).needsConfirm).toBe(true)
  })

  it('确认语要复述条数与范围，不能只说「确定吗」', () => {
    const sel = bulkSelection({ scope: 'matched', pageIds, selectedIds: [], matchedTotal: 8000 })
    expect(sel.confirmMessage).toContain('8000')
    expect(sel.confirmMessage).toContain('当前页看不到')
  })

  it('有没有筛选条件，措辞不一样：没筛选时「全部匹配」就是全表', () => {
    const filtered = bulkSelection({ scope: 'matched', pageIds, selectedIds: [], matchedTotal: 20, filtered: true })
    const whole = bulkSelection({ scope: 'matched', pageIds, selectedIds: [], matchedTotal: 20 })
    expect(filtered.summary).toContain('符合当前筛选条件')
    expect(whole.summary).toContain('全表')
  })

  it('什么都没选时说清是「未选择任何项」，条数为 0', () => {
    const sel = bulkSelection({ scope: 'selected', pageIds, selectedIds: [], matchedTotal: 8000 })
    expect(sel.count).toBe(0)
    expect(sel.summary).toBe('未选择任何项')
  })
})

describe('升级到「全部匹配」的入口', () => {
  it('当前页全勾上、且匹配总数更多时才给', () => {
    expect(canEscalate({ pageIds, selectedIds: [1, 2, 3], matchedTotal: 8000 })).toBe(true)
  })

  it('只勾了一部分不给：这时候用户还没表达「我要的不止这一页」', () => {
    expect(canEscalate({ pageIds, selectedIds: [1, 2], matchedTotal: 8000 })).toBe(false)
  })

  it('匹配总数就等于当前页时不给：那个入口点了也没有区别', () => {
    expect(canEscalate({ pageIds, selectedIds: [1, 2, 3], matchedTotal: 3 })).toBe(false)
  })

  it('入口文案带上条数与范围', () => {
    expect(escalateLabel(8000, true)).toContain('8000')
    expect(escalateLabel(8000, true)).toContain('符合当前筛选条件')
    expect(escalateLabel(8000)).toContain('全表')
  })
})

describe('部分失败', () => {
  const items = [
    { id: 1, ok: true },
    { id: 2, ok: false, reason: '已出库，不能撤销' },
    { id: 3, ok: false }
  ]

  it('拆成成功与失败两份，并给出一句摘要', () => {
    const outcome = bulkOutcome(items)
    expect(outcome.kind).toBe('partial')
    expect(outcome.succeeded).toEqual([1])
    expect(outcome.failed.map((f) => f.id)).toEqual([2, 3])
    expect(outcome.summary).toBe('1 项成功，2 项失败')
  })

  it('没给原因的失败也要有一句话——空着的那一行没人知道该怎么办', () => {
    expect(bulkOutcome(items).failed[1].reason).toBe('未知原因')
  })

  it('重试只发失败项：成功项再发一次就是重复执行', () => {
    expect(bulkOutcome(items).retryIds).toEqual([2, 3])
  })

  it('全成功与全失败各成一档', () => {
    expect(bulkOutcome([{ id: 1, ok: true }]).kind).toBe('all-ok')
    expect(bulkOutcome([{ id: 1, ok: false }]).kind).toBe('all-failed')
  })

  it('失败原因能按 id 查，行上直接标得出来', () => {
    expect(failureIndex(bulkOutcome(items))['2']).toBe('已出库，不能撤销')
  })
})

describe('重试结果并回上一轮', () => {
  const first = bulkOutcome([
    { id: 1, ok: true },
    { id: 2, ok: false, reason: '库存不足' },
    { id: 3, ok: false, reason: '库存不足' }
  ])

  it('成功集只增不减——否则界面会显示「成功 1 项」，而实际已经成功 2 项', () => {
    const merged = mergeOutcome(first, bulkOutcome([{ id: 2, ok: true }, { id: 3, ok: false, reason: '库存不足' }]))
    expect(merged.succeeded).toEqual([1, 2])
    expect(merged.failed.map((f) => f.id)).toEqual([3])
    expect(merged.total).toBe(3)
    expect(merged.summary).toBe('2 项成功，1 项失败')
  })

  it('重试全成功之后整批算全成功', () => {
    const merged = mergeOutcome(first, bulkOutcome([{ id: 2, ok: true }, { id: 3, ok: true }]))
    expect(merged.kind).toBe('all-ok')
    expect(merged.retryIds).toEqual([])
  })

  it('重试又失败时，失败原因以这一轮为准', () => {
    const merged = mergeOutcome(first, bulkOutcome([{ id: 2, ok: false, reason: '已被他人锁定' }, { id: 3, ok: true }]))
    expect(merged.failed).toEqual([{ id: 2, reason: '已被他人锁定' }])
    expect(merged.succeeded).toEqual([1, 3])
  })
})
