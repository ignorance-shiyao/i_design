import { describe, expect, it } from 'vitest'
import {
  RETENTION_SHADES,
  buildRetention,
  retentionShade,
  type RetentionCohortInput
} from './retention'

/* 老批次到得了第 3 期，新批次只到第 1 期——留存表本来就是个三角形 */
const cohorts: RetentionCohortInput[] = [
  { id: '2026-01', label: '1 月进来的', size: 100, values: [80, 60, 50] },
  { id: '2026-02', label: '2 月进来的', size: 200, values: [150, 100, null] },
  { id: '2026-03', label: '3 月进来的', size: 50, values: [40, null, null] }
]

describe('留存口径', () => {
  it('分母恒为本批期初，不是上一期', () => {
    const model = buildRetention(cohorts)
    const first = model.cohorts[0]
    // 100 → 80 → 60：第 2 期是 60/100，不是 60/80
    expect(first.cells[1].rate).toBeCloseTo(0.6)
    expect(first.cells[1].description).toContain('占本批期初')
    expect(model.basis).toContain('不是上一期')
  })

  it('还没到那一期是空格，不是 0', () => {
    const model = buildRetention(cohorts)
    const newest = model.cohorts[2]
    expect(newest.cells[1].state).toBe('pending')
    expect(newest.cells[1].rate).toBeNull()
    expect(newest.cells[1].rateText).toBe('—')
    expect(newest.cells[1].description).toContain('不是 0')
    // 上色也要留空，而不是涂成最浅的一档
    expect(retentionShade(newest.cells[1])).toBeNull()
    expect(retentionShade(newest.cells[0])).toBe(4)
  })

  it('每期平均标明用了几个批次，没到齐的那几期标为不可比', () => {
    const model = buildRetention(cohorts)
    expect(model.averages[0].comparable).toBe(true)
    expect(model.averages[0].cohorts).toBe(3)
    // 第 1 期：0.8、0.75、0.8
    expect(model.averages[0].rate).toBeCloseTo((0.8 + 0.75 + 0.8) / 3)

    expect(model.averages[2].comparable).toBe(false)
    expect(model.averages[2].cohorts).toBe(1)
    expect(model.averages[2].description).toContain('幸存者平均')
    expect(model.caption).toContain('只代表已到期的批次')
  })

  it('留下的人比期初还多是矛盾，整批作废并说明原因', () => {
    const model = buildRetention([
      { id: 'a', label: '这一批', size: 100, values: [80, 120] },
      ...cohorts
    ])
    expect(model.excluded[0].id).toBe('a')
    expect(model.excluded[0].reason).toContain('比期初还多')
    expect(model.cohorts.some((c) => c.id === 'a')).toBe(false)
    // 剩下的批次照常算
    expect(model.state).toBe('ready')
    expect(model.cohorts).toHaveLength(3)
  })

  it('没有分母的批次不画成 0%：那是「一个都没留下」，不是「不知道有多少人」', () => {
    const model = buildRetention([
      { id: 'none', label: '没报期初', size: null, values: [10] },
      { id: 'zero', label: '期初是 0', size: 0, values: [0] },
      ...cohorts
    ])
    expect(model.excluded.map((e) => e.id)).toEqual(['none', 'zero'])
    expect(model.excluded[0].reason).toContain('没有分母')
    expect(model.excluded[1].reason).toContain('无定义')
    expect(model.caption).toContain('未计入')
  })

  it('批次顺序照输入给的来——留存表的行序是时间，重排会让人读错', () => {
    const model = buildRetention(cohorts)
    expect(model.cohorts.map((c) => c.id)).toEqual(['2026-01', '2026-02', '2026-03'])
  })

  it('回流让某一期比上一期多是正常的，不算矛盾', () => {
    const model = buildRetention([{ id: 'a', label: '这一批', size: 100, values: [50, 60] }])
    expect(model.state).toBe('ready')
    expect(model.cohorts[0].cells[1].rate).toBeCloseTo(0.6)
  })

  it('空 ID 与重复 ID 判无效，各说各的原因', () => {
    expect(buildRetention([{ id: '', label: '', size: 1, values: [1] }]).caption).toContain('不能为空')
    expect(
      buildRetention([
        { id: 'a', label: 'A', size: 1, values: [1] },
        { id: 'a', label: '又一个 A', size: 1, values: [1] }
      ]).caption
    ).toContain('重复')
  })

  it('空数据与「一个批次都没留下」各有各的说法，都不遗留旧行', () => {
    expect(buildRetention([]).state).toBe('empty')
    const allBad = buildRetention([{ id: 'a', label: 'A', size: null, values: [1] }])
    expect(allBad.state).toBe('empty')
    expect(allBad.cohorts).toHaveLength(0)
    expect(allBad.averages).toHaveLength(0)
    expect(allBad.caption).toContain('未计入')
  })

  it('期数取最长的那一批，短批次后面是空格而不是没有格子', () => {
    const model = buildRetention(cohorts)
    expect(model.periods).toBe(3)
    expect(model.cohorts[2].cells).toHaveLength(3)
    expect(model.cohorts[2].reach).toBe(1)
  })

  it('不修改入参', () => {
    const input = structuredClone(cohorts)
    buildRetention(input)
    expect(input).toEqual(cohorts)
  })
})

describe('色阶分档', () => {
  it('按比例本身分档，不按在本图里排第几——两张图才比得了', () => {
    const low = buildRetention([{ id: 'a', label: 'A', size: 100, values: [5, 10, 15] }])
    const high = buildRetention([{ id: 'a', label: 'A', size: 100, values: [55, 60, 65] }])
    // 两批都是「自己这张图里最小的那一格」，但深浅必须差得出来
    expect(retentionShade(low.cohorts[0].cells[0])).toBe(1)
    expect(retentionShade(high.cohorts[0].cells[0])).toBe(3)
  })

  it('0% 与 100% 都落在档内，不越界', () => {
    const model = buildRetention([{ id: 'a', label: 'A', size: 100, values: [0, 100] }])
    expect(retentionShade(model.cohorts[0].cells[0])).toBe(1)
    expect(retentionShade(model.cohorts[0].cells[1])).toBe(RETENTION_SHADES)
  })
})
