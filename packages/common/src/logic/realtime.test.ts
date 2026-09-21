import { describe, expect, it } from 'vitest'
import { buildRealtimeWindow, type RealtimePointInput } from './realtime'

/** 窗口 [0, 4000)，每桶 1000ms：四个桶 */
const opts = { now: 4000, windowMs: 4000, bucketMs: 1000, unit: ' 次' }

const points: RealtimePointInput[] = [
  { id: 'a', at: 500, value: 1 },
  { id: 'b', at: 1200, value: 2 },
  { id: 'c', at: 1800, value: 3 },
  { id: 'd', at: 2500, value: 0, mark: '发布' },
  { id: 'e', at: 3600, value: 4 }
]

describe('实时滑窗：时间窗与事件时间', () => {
  it('窗口按时间切开，点按事件时间归桶，不按到达顺序', () => {
    // 故意打乱到达顺序：先到 e，再到 a
    const shuffled = [points[4], points[0], points[2], points[1], points[3]]
    const model = buildRealtimeWindow(shuffled, opts)
    expect(model.mode).toBe('time')
    expect(model.buckets).toHaveLength(4)
    expect(model.buckets.map((bucket) => bucket.value)).toEqual([1, 5, 0, 4])
    expect(model.buckets[1].pointCount).toBe(2)
    expect(model.basis).toContain('按事件时间归桶')
  })

  it('同一 id 后写覆盖前写，不靠到达序叠加', () => {
    const model = buildRealtimeWindow(
      [
        { id: 'x', at: 1500, value: 10 },
        { id: 'x', at: 1500, value: 1 }
      ],
      opts
    )
    expect(model.buckets[1].value).toBe(1)
    expect(model.buckets[1].pointCount).toBe(1)
  })

  it('迟到的点按事件时间归进历史桶，不进当前桶', () => {
    // 当前窗 [10000, 14000)；一个点事件时间在 10500，另一个在 9000（已滑出）
    const model = buildRealtimeWindow(
      [
        { id: 'late', at: 9000, value: 99 },
        { id: 'ok', at: 10500, value: 3 }
      ],
      { now: 14000, windowMs: 4000, bucketMs: 1000 }
    )
    expect(model.buckets[0].value).toBe(3)
    expect(model.buckets.some((bucket) => bucket.value === 99)).toBe(false)
    expect(model.late[0].id).toBe('late')
    expect(model.late[0].reason).toContain('已滑出')
  })
})

describe('实时滑窗：断流不是 0', () => {
  it('断流空档是 gap/null，真正的 0 是 ready/0', () => {
    const model = buildRealtimeWindow(
      [
        { id: 'a', at: 500, value: 2 },
        { id: 'z', at: 3500, value: 0 }
      ],
      { ...opts, gaps: [{ from: 1000, to: 3000 }] }
    )
    expect(model.buckets[0]).toMatchObject({ state: 'ready', value: 2 })
    expect(model.buckets[1]).toMatchObject({ state: 'gap', value: null, valueText: '—' })
    expect(model.buckets[2]).toMatchObject({ state: 'gap', value: null })
    expect(model.buckets[3]).toMatchObject({ state: 'ready', value: 0, valueText: '0 次' })
    expect(model.caption).toContain('断流空档')
    expect(model.buckets[1].description).toContain('不是 0')
  })

  it('连通且无点的桶合计是 0，不是 gap', () => {
    const model = buildRealtimeWindow([{ id: 'a', at: 500, value: 1 }], opts)
    expect(model.buckets[2]).toMatchObject({ state: 'ready', value: 0 })
    expect(model.buckets[2].description).toContain('不是断流')
  })
})

describe('实时滑窗：暂停与延迟', () => {
  it('暂停时窗口钉在 freezeAt，不跟着 now 滑', () => {
    const frozen = buildRealtimeWindow(points, {
      now: 99999,
      windowMs: 4000,
      bucketMs: 1000,
      paused: true,
      freezeAt: 4000,
      unit: ' 次'
    })
    const live = buildRealtimeWindow(points, opts)
    expect(frozen.paused).toBe(true)
    expect(frozen.windowEnd).toBe(4000)
    expect(frozen.windowStart).toBe(0)
    expect(frozen.buckets.map((bucket) => bucket.value)).toEqual(
      live.buckets.map((bucket) => bucket.value)
    )
    expect(frozen.caption).toContain('已暂停')
  })

  it('暂停却不给 freezeAt，整张图无效', () => {
    const model = buildRealtimeWindow(points, {
      now: 4000,
      windowMs: 4000,
      bucketMs: 1000,
      paused: true
    })
    expect(model.state).toBe('invalid')
    expect(model.caption).toContain('钉住')
  })

  it('延迟按窗口右端与最新事件时间的差来报，没有点时不是 0', () => {
    const model = buildRealtimeWindow(
      [{ id: 'a', at: 1000, value: 1 }],
      { now: 4000, windowMs: 4000, bucketMs: 1000 }
    )
    expect(model.lagMs).toBe(3000)
    expect(model.lagText).toContain('3.0 秒')

    const empty = buildRealtimeWindow([], opts)
    expect(empty.lagMs).toBeNull()
    expect(empty.lagText).toBe('尚无事件')
  })

  it('事件标记挂在事件时间所在的桶上', () => {
    const model = buildRealtimeWindow(points, opts)
    expect(model.marks).toHaveLength(1)
    expect(model.marks[0].label).toBe('发布')
    expect(model.marks[0].bucketIndex).toBe(2)
    expect(model.buckets[2].marks[0].label).toBe('发布')
  })
})

describe('实时滑窗：缓存与校验', () => {
  it('缓存到顶时从最老的点丢掉，被挤掉的窗内点要报出来', () => {
    const many: RealtimePointInput[] = Array.from({ length: 5 }, (_, i) => ({
      id: `p${i}`,
      at: 500 + i * 700,
      value: i + 1
    }))
    const model = buildRealtimeWindow(many, { ...opts, maxPoints: 2 })
    expect(model.buckets.flatMap((bucket) => bucket.pointCount)).toEqual(
      expect.any(Array)
    )
    // 只留事件时间最晚的两个：at 2600(value 4) 与 3300(value 5)
    expect(model.late.length).toBeGreaterThan(0)
    expect(model.late.every((row) => row.reason.includes('缓存上限'))).toBe(true)
    const sum = model.buckets.reduce((acc, bucket) => acc + (bucket.value ?? 0), 0)
    expect(sum).toBe(4 + 5)
  })

  it('空 ID、坏时间、坏值、坏窗口参数都有各自的说法', () => {
    expect(buildRealtimeWindow([{ id: '', at: 1, value: 1 }], opts).excluded[0].reason).toContain('ID')
    expect(
      buildRealtimeWindow([{ id: 'a', at: Number.NaN, value: 1 }], opts).excluded[0].reason
    ).toContain('事件时间')
    expect(
      buildRealtimeWindow([{ id: 'a', at: 1, value: Number.NaN }], opts).excluded[0].reason
    ).toContain('观测值')
    expect(buildRealtimeWindow(points, { ...opts, windowMs: -1 }).state).toBe('invalid')
    expect(buildRealtimeWindow(points, { ...opts, bucketMs: 3000 }).state).toBe('invalid')
    expect(buildRealtimeWindow(points, { ...opts, maxPoints: 0 }).state).toBe('invalid')
  })

  it('不修改入参', () => {
    const input = structuredClone(points)
    buildRealtimeWindow(input, opts)
    expect(input).toEqual(points)
  })

  it('坐标轴恒含 0', () => {
    const model = buildRealtimeWindow([{ id: 'a', at: 1500, value: 5 }], opts)
    expect(model.min).toBe(0)
    expect(model.max).toBeGreaterThanOrEqual(5)
  })
})
