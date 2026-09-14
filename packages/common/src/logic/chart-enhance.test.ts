/**
 * 百分比堆叠、阶梯线与目标线的回归测试。
 *
 * 百分比堆叠的全部难点在分母上，所以用例也集中在那儿。
 */
import { describe, expect, it } from 'vitest'
import { percentStack, stepPath, targetProgress } from './chart'

const series = [
  { name: '直销', data: [30, 0, 50, -10] },
  { name: '代理', data: [70, 0, 150, 20] }
]

describe('百分比堆叠', () => {
  it('正常列换算成占比，两条加起来是 100', () => {
    const { series: out } = percentStack(series)
    expect(out[0].data[0]).toBe(30)
    expect(out[1].data[0]).toBe(70)
    expect(out[0].data[2] + out[1].data[2]).toBeCloseTo(100)
  })

  it('整列为 0 时不换算：硬除会得到 NaN，再被渲染成 0，看起来像「这一档占 0%」', () => {
    const { series: out, skipped } = percentStack(series)
    expect(skipped).toContainEqual({ index: 1, reason: 'zero-total' })
    expect(out[0].data[1]).toBe(0)
    expect(Number.isNaN(out[0].data[1])).toBe(false)
  })

  it('列里有负数时不换算——「占总量的百分之多少」这句话本身不成立', () => {
    const { skipped } = percentStack(series)
    expect(skipped).toContainEqual({ index: 3, reason: 'has-negative' })
  })

  it('空数据不抛错', () => {
    expect(percentStack([])).toEqual({ series: [], skipped: [] })
  })
})

describe('阶梯线', () => {
  it('每段先走后跳（after）：值保持到下一个点', () => {
    const path = stepPath([0, 10], 0, 10, 100, 100, 'after')
    // 第二段先横着走到 x=100 仍在 y=100（值 0），再竖着跳到 y=0（值 10）
    expect(path).toBe('M0.00 100.00L100.00 100.00L100.00 0.00')
  })

  it('before 是先跳后走', () => {
    expect(stepPath([0, 10], 0, 10, 100, 100, 'before')).toBe('M0.00 100.00L0.00 0.00L100.00 0.00')
  })

  it('空数据返回空路径而不是一个残缺的 M', () => {
    expect(stepPath([], 0, 1, 10, 10)).toBe('')
  })
})

describe('目标线', () => {
  it('说得出还差多少，而不只是达没达成', () => {
    expect(targetProgress([{ name: 'a', data: [80, 92] }], 100)).toEqual({ reached: false, latest: 92, gap: 8 })
    expect(targetProgress([{ name: 'a', data: [80, 120] }], 100)).toEqual({ reached: true, latest: 120, gap: -20 })
  })

  it('没有有效数据时不假装达成', () => {
    expect(targetProgress([{ name: 'a', data: [] }], 100)).toEqual({ reached: false, latest: null, gap: null })
  })
})
