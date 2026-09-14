import { describe, expect, it } from 'vitest'
import { errorBar, histogram, kde, pearson, scatterMatrix, violinShape } from './stats'

/** 0…99 的均匀样本，形状已知，便于核对 */
const uniform = Array.from({ length: 100 }, (_, i) => i)

describe('histogram', () => {
  it('每个样本都落进某个箱，总数不丢', () => {
    const h = histogram(uniform)
    expect(h.bins.reduce((sum, b) => sum + b.count, 0)).toBe(100)
    expect(h.count).toBe(100)
  })

  it('最大值落在最后一箱里，而不是掉到区间外', () => {
    const h = histogram([...uniform, 99])
    expect(h.bins[h.bins.length - 1].count).toBeGreaterThan(0)
    expect(h.bins.reduce((sum, b) => sum + b.count, 0)).toBe(101)
  })

  it('IQR 为 0 时退回 Sturges，而不是算出无穷多个箱', () => {
    const skewed = [...Array(60).fill(5), 1, 2, 3, 40, 80]
    const h = histogram(skewed)
    expect(h.rule).toBe('sturges')
    expect(h.bins.length).toBeGreaterThan(0)
    expect(h.bins.length).toBeLessThan(100)
  })

  it('指定固定宽度时用它，并把用的规则报回来', () => {
    const h = histogram(uniform, { rule: 'fixed', width: 25 })
    expect(h.rule).toBe('fixed')
    expect(h.width).toBe(25)
    expect(h.bins).toHaveLength(4)
  })

  it('fixed 却没给宽度是调用错误，直接抛', () => {
    expect(() => histogram(uniform, { rule: 'fixed' })).toThrow(/必须给出正的 width/)
  })

  it('样本太少时照画，但明说这里是噪声', () => {
    const h = histogram([1, 2, 3, 9])
    expect(h.issues.map((i) => i.kind)).toContain('too-few')
  })

  it('取值全同时不画分布，直接说看不出东西', () => {
    const h = histogram(Array(30).fill(7))
    expect(h.issues.map((i) => i.kind)).toContain('all-equal')
    expect(h.bins).toHaveLength(1)
  })

  it('空样本给空结果而不是崩', () => {
    expect(histogram([]).issues[0].kind).toBe('empty')
  })

  it('NaN 与 Infinity 不参与统计', () => {
    const h = histogram([1, 2, NaN, Infinity, 3])
    expect(h.count).toBe(3)
  })
})

describe('kde', () => {
  it('带宽按 Silverman 算出来并报回去', () => {
    const d = kde(uniform)
    expect(d.bandwidth).toBeGreaterThan(0)
    expect(d.points.length).toBe(64)
  })

  it('显式带宽优先——这是密度图里唯一重要的旋钮', () => {
    expect(kde(uniform, { bandwidth: 3 }).bandwidth).toBe(3)
  })

  it('密度非负，且积分约等于 1', () => {
    const d = kde(uniform)
    expect(Math.min(...d.points.map((p) => p.y))).toBeGreaterThanOrEqual(0)
    const step = d.points[1].x - d.points[0].x
    const area = d.points.reduce((sum, p) => sum + p.y * step, 0)
    expect(area).toBeGreaterThan(0.95)
    expect(area).toBeLessThan(1.05)
  })

  it('取值全同时不画假曲线，直接说估不出来', () => {
    const d = kde(Array(30).fill(4))
    expect(d.points).toEqual([])
    expect(d.issues.map((i) => i.kind)).toContain('all-equal')
  })

  it('样本不足两个时不算', () => {
    expect(kde([1]).issues[0].kind).toBe('empty')
  })
})

describe('errorBar', () => {
  const sample = [2, 4, 4, 4, 5, 5, 7, 9]

  it('三种误差棒长度不同，且顺序固定：标准差 > 置信区间 > 标准误', () => {
    const sd = errorBar(sample, 'sd').delta
    const sem = errorBar(sample, 'sem').delta
    const ci = errorBar(sample, 'ci95').delta
    expect(sd).toBeGreaterThan(ci)
    expect(ci).toBeGreaterThan(sem)
  })

  it('图注写清它是什么——不写清等于没画', () => {
    expect(errorBar(sample, 'sd').caption).toMatch(/标准差/)
    expect(errorBar(sample, 'sem').caption).toMatch(/标准误/)
    expect(errorBar(sample, 'ci95').caption).toMatch(/95% 置信区间/)
  })

  it('上下端就是均值加减半长', () => {
    const bar = errorBar(sample, 'sd')
    expect(bar.low).toBeCloseTo(bar.mean - bar.delta, 10)
    expect(bar.high).toBeCloseTo(bar.mean + bar.delta, 10)
  })

  it('单个样本没有离散度，半长为 0 而不是 NaN', () => {
    expect(errorBar([5], 'sd').delta).toBe(0)
  })

  it('空样本明说没有样本', () => {
    expect(errorBar([], 'sem').caption).toMatch(/没有有效样本/)
  })
})

describe('violinShape', () => {
  it('轮廓就是密度，并给出峰值供跨图归一化', () => {
    const v = violinShape(uniform)
    expect(v.points.length).toBe(64)
    expect(v.peak).toBeCloseTo(Math.max(...v.points.map((p) => p.density)), 12)
  })

  it('两把小提琴的峰值可比——宽度归一化要靠它', () => {
    const a = violinShape(uniform)
    const b = violinShape(uniform.map((v) => v * 2))
    expect(a.peak).toBeGreaterThan(b.peak)
  })
})

describe('scatterMatrix', () => {
  const rows = [
    { a: 1, b: 2, c: 9 },
    { a: 2, b: 4, c: 7 },
    { a: 3, b: 6, c: 5 },
    { a: 4, b: 8, c: 1 }
  ]

  it('只出下三角与对角线：上三角是同一批关系的镜像', () => {
    const cells = scatterMatrix(['a', 'b', 'c'], rows)
    expect(cells).toHaveLength(6)
    expect(cells.every((c) => c.col <= c.row)).toBe(true)
  })

  it('对角线是分布而不是散点，也没有自相关系数', () => {
    const diag = scatterMatrix(['a', 'b'], rows).filter((c) => c.diagonal)
    expect(diag).toHaveLength(2)
    expect(diag.every((c) => c.correlation === null)).toBe(true)
  })

  it('完全线性的两列相关系数为 1，反向为 −1', () => {
    const cells = scatterMatrix(['a', 'b', 'c'], rows)
    expect(cells.find((c) => c.xField === 'a' && c.yField === 'b')!.correlation).toBeCloseTo(1, 12)
    expect(cells.find((c) => c.xField === 'a' && c.yField === 'c')!.correlation).toBeLessThan(-0.9)
  })
})

describe('pearson', () => {
  it('常量列返回 null，而不是 0——那不是「不相关」，是算不出', () => {
    expect(pearson([1, 1, 1, 1], [1, 2, 3, 4])).toBeNull()
  })

  it('不足三对时返回 null', () => {
    expect(pearson([1, 2], [2, 4])).toBeNull()
  })

  it('缺失值成对丢弃', () => {
    expect(pearson([1, 2, NaN, 4], [2, 4, 8, 8])).not.toBeNull()
  })
})
