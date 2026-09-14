import { describe, expect, it } from 'vitest'
import { barRect, categoryBands, dualAxis, rankOrder, valueAxis } from './axis'

describe('valueAxis', () => {
  it('纵向时值向上增长：最大值在像素 0，最小值在底', () => {
    const axis = valueAxis(0, 100, 200, 'vertical')
    expect(axis.ticks[0].value).toBe(0)
    expect(axis.ticks[0].offset).toBe(200)
    expect(axis.ticks[axis.ticks.length - 1].offset).toBe(0)
  })

  it('横向时值向右增长：与像素同向', () => {
    const axis = valueAxis(0, 100, 200, 'horizontal')
    expect(axis.ticks[0].offset).toBe(0)
    expect(axis.ticks[axis.ticks.length - 1].offset).toBe(200)
  })

  it('横纵用同一套刻度值——两种方向的刻度密度必须一致', () => {
    const v = valueAxis(0, 137, 200, 'vertical').ticks.map((t) => t.value)
    const h = valueAxis(0, 137, 200, 'horizontal').ticks.map((t) => t.value)
    expect(h).toEqual(v)
  })

  it('全为正值时基线在零处，也就是轴的起点', () => {
    expect(valueAxis(0, 50, 100, 'vertical').baseline).toBe(100)
    expect(valueAxis(0, 50, 100, 'horizontal').baseline).toBe(0)
  })

  it('跨零时基线落在中间，负值条才有地方长', () => {
    const axis = valueAxis(-50, 50, 100, 'vertical')
    expect(axis.baseline).toBeGreaterThan(0)
    expect(axis.baseline).toBeLessThan(100)
  })

  it('范围完全在零以上时基线夹在轴内，不会画到画布外', () => {
    const axis = valueAxis(20, 80, 100, 'vertical')
    expect(axis.baseline).toBeLessThanOrEqual(100)
    expect(axis.baseline).toBeGreaterThanOrEqual(0)
  })
})

describe('categoryBands', () => {
  it('等宽切分，中心在带的正中', () => {
    const bands = categoryBands(4, 200)
    expect(bands).toHaveLength(4)
    expect(bands[0].size).toBe(50)
    expect(bands[1].center).toBe(75)
  })

  it('零个类目不除以零', () => {
    expect(categoryBands(0, 200)).toEqual([])
  })
})

describe('barRect', () => {
  const band = { index: 0, start: 10, size: 40, center: 30 }

  it('纵向：厚度是宽，值跨度是高', () => {
    const r = barRect({ band, thickness: 20, offsetInBand: 10 }, { from: 100, to: 40 }, 'vertical')
    expect(r).toMatchObject({ x: 20, y: 40, width: 20, height: 60 })
  })

  it('横向：厚度是高，值跨度是宽', () => {
    const r = barRect({ band, thickness: 20, offsetInBand: 10 }, { from: 0, to: 60 }, 'horizontal')
    expect(r).toMatchObject({ x: 0, y: 20, width: 60, height: 20 })
  })

  it('负值条从基线反向长出去，并被标记出来——圆角要换到另一头', () => {
    const down = barRect({ band, thickness: 20 }, { from: 50, to: 90 }, 'vertical')
    expect(down.negative).toBe(true)
    expect(down.y).toBe(50)
    const leftward = barRect({ band, thickness: 20 }, { from: 50, to: 10 }, 'horizontal')
    expect(leftward.negative).toBe(true)
    expect(leftward.x).toBe(10)
  })
})

describe('rankOrder', () => {
  it('横条默认按降序——横条几乎总是排名，乱序读者会自己找最长的那根', () => {
    expect(rankOrder([3, 9, 1])).toEqual([1, 0, 2])
  })

  it('保留原顺序是显式选择', () => {
    expect(rankOrder([3, 9, 1], 'none')).toEqual([0, 1, 2])
  })
})

describe('dualAxis', () => {
  const series = [
    { name: '销售额', data: [100, 120, 140] },
    { name: '转化率', data: [3, 4, 5] }
  ]

  it('两侧单位不同、都有归属时没有提示', () => {
    const r = dualAxis(series, { series: [0], unit: '元' }, { series: [1], unit: '%' }, 200)
    expect(r.issues).toEqual([])
    expect(r.left.ticks.length).toBeGreaterThan(1)
    expect(r.right.ticks.length).toBeGreaterThan(1)
  })

  it('两侧单位相同时说明这本该是一个轴', () => {
    const r = dualAxis(series, { series: [0], unit: '元' }, { series: [1], unit: '元' }, 200)
    expect(r.issues.join()).toMatch(/一个轴的事/)
  })

  it('缺单位时提示——读者无从判断右轴在说什么量', () => {
    const r = dualAxis(series, { series: [0], unit: '元' }, { series: [1], unit: '  ' }, 200)
    expect(r.issues.join()).toMatch(/都必须写明单位/)
  })

  it('有系列没指定归属时点名', () => {
    const three = [...series, { name: '退款', data: [1, 2, 3] }]
    const r = dualAxis(three, { series: [0], unit: '元' }, { series: [1], unit: '%' }, 200)
    expect(r.issues.join()).toMatch(/退款/)
  })

  it('两侧都从零起时零位天然对齐', () => {
    const r = dualAxis(series, { series: [0], unit: '元' }, { series: [1], unit: '%' }, 200)
    expect(r.zeroAligned).toBe(true)
  })

  it('一侧跨零另一侧不跨时提示零位错位', () => {
    const mixed = [
      { name: '净增', data: [-40, 20, 60] },
      { name: '转化率', data: [3, 4, 5] }
    ]
    const r = dualAxis(mixed, { series: [0], unit: '人' }, { series: [1], unit: '%' }, 200)
    expect(r.zeroAligned).toBe(false)
    expect(r.issues.join()).toMatch(/零位/)
  })

  it('空系列不炸，也不产生零宽度的轴', () => {
    const r = dualAxis([], { series: [], unit: '元' }, { series: [], unit: '%' }, 200)
    expect(r.left.max).toBeGreaterThan(r.left.min)
  })
})
