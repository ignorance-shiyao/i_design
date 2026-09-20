import { describe, expect, it } from 'vitest'
import { buildPareto } from './pareto'
const input = [{ id: 'a', label: '接口', value: 20 }, { id: 'b', label: '超时', value: 60 }, { id: 'c', label: '其他', value: 20 }]
describe('帕累托口径', () => {
  it('降序稳定排列并保留原始行映射，不修改输入', () => {
    const before = JSON.stringify(input), model = buildPareto(input)
    expect(model.rows.map(row => row.id)).toEqual(['b', 'a', 'c'])
    expect(model.rows.map(row => row.sourceIndex)).toEqual([1, 0, 2])
    expect(JSON.stringify(input)).toBe(before)
  })
  it('同源分母、占比、累计、柱高与阈值', () => {
    const model = buildPareto(input, { unit: ' 次' })
    expect(model.total).toBe(100)
    expect(model.rows.map(row => row.cumulative)).toEqual([0.6, 0.8, 1])
    expect(model.rows.map(row => row.share)).toEqual([0.6, 0.2, 0.2])
    expect(model.rows[0].relative).toBe(1)
    expect(model.cutoffRank).toBe(2)
    expect(model.totalText).toBe('100 次')
    expect(model.rows[0].description).toContain('累计 60.0%')
    expect(buildPareto(input, { threshold: 1 }).cutoffRank).toBe(3)
  })
  it('缺失、非有限数与负值明确排除，零值保留', () => {
    const model = buildPareto([...input, { id: 'd', label: '缺失', value: null }, { id: 'e', label: '非法', value: NaN }, { id: 'f', label: '负值', value: -1 }, { id: 'g', label: '零', value: 0 }])
    expect(model.excluded.map(row => row.sourceIndex)).toEqual([3, 4, 5])
    expect(model.total).toBe(100)
    expect(model.rows[model.rows.length - 1]?.value).toBe(0)
    expect(model.caption).toContain('累计只代表已知有效值')
    expect(JSON.parse(JSON.stringify(model))).toEqual(model)
  })
  it('空数据与全零不画虚构累计100%', () => {
    expect(buildPareto([]).state).toBe('empty')
    const model = buildPareto([{ id: 'z', label: '零', value: 0 }])
    expect(model.state).toBe('zero')
    expect(model.rows[0].cumulative).toBeNull()
    expect(model.cutoffRank).toBeNull()
    expect(model.rows[0].cumulativeText).toBe('—')
  })
  it('极小的非零值不显示成零', () => {
    const model = buildPareto([{ id: 'tiny', label: '微量', value: 0.00000001 }])
    expect(model.totalText).toBe('1.000e-8')
    expect(model.rows[0].valueText).not.toBe('0')
    expect(model.rows[0].cumulative).toBe(1)
  })
  it('重复 ID、非法阈值与溢出拒绝整个模型', () => {
    expect(buildPareto([input[0], input[0]]).state).toBe('invalid')
    for (const threshold of [0, -1, 2, NaN, Infinity]) expect(buildPareto(input, { threshold }).state).toBe('invalid')
    expect(buildPareto([{ id: 'x', label: 'x', value: Number.MAX_VALUE }, { id: 'y', label: 'y', value: Number.MAX_VALUE }]).state).toBe('invalid')
  })
})
