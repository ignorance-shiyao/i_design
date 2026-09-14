/**
 * 数据集与数据质量的回归测试。
 *
 * 每一条都对着一种「抹平」的写法：?? 0、filter(Boolean)、取绝对值、
 * 按浏览器时区分桶。它们都很短，也都会让图说出与数据不同的话。
 */
import { describe, expect, it } from 'vitest'
import type { ChartDataset, ChartSpec } from '../contracts/chart'
import { aggregate, bucketStart, dataIssues, issueText, toLegacySeries, toSeries } from './dataset'

const day = (d: number) => Date.UTC(2026, 2, d)

const dataset: ChartDataset = {
  fields: [
    { key: 'date', label: '日期', kind: 'time', tzOffsetMinutes: 480 },
    { key: 'amount', label: '销售额', kind: 'measure', unit: '元' },
    { key: 'region', label: '区域', kind: 'dimension' }
  ],
  rows: [
    { date: day(16), amount: 120, region: '华东' },
    { date: day(16), amount: 80, region: '华南' },
    { date: day(17), amount: null, region: '华东' },
    { date: day(17), amount: 60, region: '华南' },
    { date: day(18), amount: -20, region: '华东' },
    { date: day(18), amount: 90, region: null }
  ]
}

const spec: ChartSpec = { type: 'line', x: 'date', y: ['amount'], groupBy: 'region', bucket: 'day' }

describe('聚合', () => {
  it('空集合返回 null 而不是 0——「没有数据」与「加起来是 0」是两件事', () => {
    expect(aggregate([], 'sum')).toBeNull()
    expect(aggregate([null, null], 'avg')).toBeNull()
    // count 是唯一的例外：没有数据就是 0 条
    expect(aggregate([null, null], 'count')).toBe(0)
  })

  it('常用聚合各自算对，缺失值不参与', () => {
    const values = [1, null, 3, 5]
    expect(aggregate(values, 'sum')).toBe(9)
    expect(aggregate(values, 'avg')).toBe(3)
    expect(aggregate(values, 'min')).toBe(1)
    expect(aggregate(values, 'max')).toBe(5)
    expect(aggregate(values, 'count')).toBe(3)
    expect(aggregate(values, 'median')).toBe(3)
    expect(aggregate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'p95')).toBeCloseTo(9.55, 2)
  })
})

describe('时间分桶', () => {
  it('按给定时区分桶，而不是按浏览器所在时区', () => {
    // UTC 的 2026-03-16 16:30 在东八区已经是 17 日
    const ms = Date.UTC(2026, 2, 16, 16, 30)
    expect(bucketStart(ms, 'day', 480)).toBe(Date.UTC(2026, 2, 16, 16))
    expect(bucketStart(ms, 'day', 0)).toBe(Date.UTC(2026, 2, 16))
  })

  it('周一为一周之始', () => {
    // 2026-03-16 是周一
    expect(bucketStart(day(18), 'week', 0)).toBe(day(16))
    expect(bucketStart(day(22), 'week', 0)).toBe(day(16))
    expect(bucketStart(day(23), 'week', 0)).toBe(day(23))
  })

  it('月桶落在当月 1 号', () => {
    expect(bucketStart(day(18), 'month', 0)).toBe(Date.UTC(2026, 2, 1))
  })
})

describe('折成系列', () => {
  it('缺失值保持 null，不补 0', () => {
    const series = toSeries(dataset, spec)
    const east = series.find((s) => s.name === '华东')!
    expect(east.points.map((p) => p.y)).toEqual([120, null, -20])
  })

  it('分组键缺失时归入「未知」而不是丢掉——丢掉会让总数对不上', () => {
    const names = toSeries(dataset, spec).map((s) => s.name)
    expect(names).toContain('未知')
    expect(toSeries(dataset, spec).flatMap((s) => s.points.map((p) => p.y)).filter((v) => v === 90)).toHaveLength(1)
  })

  it('时间轴按时间排序，分类轴保持出现顺序', () => {
    const byTime = toSeries(dataset, spec)[0].points.map((p) => p.x)
    expect(byTime).toEqual([...byTime].sort((a, b) => Number(a) - Number(b)))

    const byCategory = toSeries(
      { ...dataset, fields: dataset.fields.map((f) => (f.key === 'region' ? f : f)) },
      { type: 'bar', x: 'region', y: ['amount'] }
    )[0].points.map((p) => p.x)
    expect(byCategory).toEqual(['华东', '华南', '未知'])
  })
})

describe('数据质量', () => {
  it('缺失值、负数、缺维度各报一条，而不是默默抹平', () => {
    const kinds = dataIssues(dataset, spec).map((i) => i.kind)
    expect(kinds).toContain('missing-values')
    expect(kinds).toContain('has-negative')
    expect(kinds).toContain('missing-dimension')
  })

  it('NaN 与无穷大单独报——那说明上游算错了，与「没上报」不是一回事', () => {
    const broken: ChartDataset = {
      fields: dataset.fields,
      rows: [{ date: day(16), amount: Number.NaN, region: '华东' }, { date: day(17), amount: 1 / 0, region: '华东' }]
    }
    const issue = dataIssues(broken, spec).find((i) => i.kind === 'invalid-numbers')
    expect(issue).toMatchObject({ kind: 'invalid-numbers', count: 2 })
  })

  it('单点、全零、空集各有定义', () => {
    const one: ChartDataset = { fields: dataset.fields, rows: [{ date: day(16), amount: 5, region: '华东' }] }
    expect(dataIssues(one, spec).map((i) => i.kind)).toContain('single-point')

    const zeros: ChartDataset = {
      fields: dataset.fields,
      rows: [{ date: day(16), amount: 0, region: '华东' }, { date: day(17), amount: 0, region: '华东' }]
    }
    expect(dataIssues(zeros, spec).map((i) => i.kind)).toContain('all-zero')

    expect(dataIssues({ fields: dataset.fields, rows: [] }, spec)).toEqual([{ kind: 'empty' }])
  })

  it('两个系列单位不同时提醒不要共用一根轴', () => {
    const mixed: ChartDataset = {
      fields: [
        { key: 'date', label: '日期', kind: 'time' },
        { key: 'amount', label: '金额', kind: 'measure', unit: '元' },
        { key: 'rate', label: '转化率', kind: 'measure', unit: '%' }
      ],
      rows: [{ date: day(16), amount: 120, rate: 12 }, { date: day(17), amount: 90, rate: 15 }]
    }
    const issue = dataIssues(mixed, { type: 'line', x: 'date', y: ['amount', 'rate'] })
      .find((i) => i.kind === 'mixed-units')
    expect(issue).toMatchObject({ units: ['元', '%'] })
    expect(issueText(issue!)).toContain('不该共用一根轴')
  })

  it('每一种问题都有一句人能读的话', () => {
    for (const issue of dataIssues(dataset, spec)) {
      expect(issueText(issue).length).toBeGreaterThan(0)
    }
  })
})

describe('与现有组件的适配', () => {
  it('转成 series + labels，并告诉调用方哪几个点是补出来的', () => {
    const legacy = toLegacySeries(dataset, spec)
    expect(legacy.labels).toEqual(['2026-03-16', '2026-03-17', '2026-03-18'])
    const east = legacy.series.find((s) => s.name === '华东')!
    expect(east.data).toEqual([120, 0, -20])
    // 第 1 个点是补出来的，不是真的 0
    expect(legacy.gaps[legacy.series.indexOf(east)]).toEqual([1])
  })
})
