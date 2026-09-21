/**
 * 实时滑窗的口径契约（astra.md 的 D07）。
 *
 * 这张图回答的是「此刻往回看，最近这一段发生了什么」。
 * 和留存一样，最危险的不是算错，而是把「没有数据」画成「数据是 0」——
 * 断流期间画成一串零，值班的人会以为流量掉光了，而其实是线断了。
 *
 * 五件事定死：
 *
 * **一、窗口按时间切，不按条数切。**
 * 「最近 100 条」在流量尖峰时可能只覆盖 3 秒，在低谷时覆盖半小时——
 * 同一张图上的横轴含义会跟着数据密度漂。这里窗口是一段固定时长，
 * 桶宽也是固定时长；条数只用来限制缓存，不定义窗口。
 * 要按条数看，那是另一张图，不能混。
 *
 * **二、迟到的点按事件时间归桶，不按到达时间。**
 * 14:00:05 发生的事，14:00:20 才送到，归进 14:00:00 那个桶——
 * 那是它真正发生的时刻。归进「当前桶」会在最新的位置凭空冒出一个尖峰，
 * 而那个尖峰在历史上从未存在。桶已经滑出缓存的，列为「来得太晚」，不静默丢弃。
 *
 * **三、断流不是 0。**
 * 某个桶的时间范围内一根点都没收到，且这段时间落在已知的断流区间里，
 * 桶的状态是 `gap`，值是 null，连折线都不连过去。真正测到的 0 是 `ready` 且值为 0。
 * 两者在图上必须能分开——否则断线会被读成业务归零。
 *
 * **四、暂停时窗口钉死，不是继续滑。**
 * 暂停是人的意图：「让我看清楚这一段」。窗口继续滑，人就永远看不清。
 * 暂停期间到达的点仍按事件时间入缓存；恢复时窗口跳到最新（从钉住的位置
 * 「追」到直播会让人搞不清自己在看哪）。暂停状态必须可见。
 *
 * **五、乱序按事件时间排序；同一 id 只留最后一次。**
 * 重试、多路汇聚都会让同一条事件来两次。按到达序画会抖；
 * 按事件时间排，同一 id 后写覆盖前写。缓存长度到顶时，从最老的那头按点丢掉——
 * 被挤掉却本该落在窗内的点，同样要报出来。
 */

export interface RealtimePointInput {
  id: string
  /** 事件发生时间（epoch ms）。归桶只认这个，不认到达时间 */
  at: number
  /** 观测值。null 表示这条点本身没带数，不参与合计，也不把桶变成断流 */
  value: number | null
  /** 可选的事件标记文案（发布、故障、切换……） */
  mark?: string
}

export interface RealtimeGapInput {
  /** 断流起（含） */
  from: number
  /** 断流止（不含） */
  to: number
}

export type RealtimeBucketState = 'ready' | 'gap'

export interface RealtimeMark {
  id: string
  label: string
  at: number
  bucketIndex: number
  description: string
}

export interface RealtimeBucket {
  index: number
  /** 桶起（含） */
  start: number
  /** 桶止（不含） */
  end: number
  state: RealtimeBucketState
  /** ready 时为合计；gap 时恒为 null——断流不是 0 */
  value: number | null
  valueText: string
  pointCount: number
  marks: RealtimeMark[]
  description: string
}

export interface RealtimeModel {
  version: 1
  state: 'ready' | 'empty' | 'invalid'
  /** 口径写死为时间窗；条数只作缓存上限 */
  mode: 'time'
  paused: boolean
  /** 窗口左端（含） */
  windowStart: number
  /** 窗口右端（不含）——直播时跟 now，暂停时钉在 freezeAt */
  windowEnd: number
  bucketMs: number
  buckets: RealtimeBucket[]
  marks: RealtimeMark[]
  /**
   * 事件时间落在已滑出窗口、或被缓存挤掉、或晚于右端的点。
   * 不是静默丢掉——调用方必须看得见「有东西没画上」。
   */
  late: { id: string; at: number; reason: string }[]
  excluded: { id: string; reason: string; sourceIndex: number }[]
  /**
   * 数据延迟：窗口右端 − 窗口内最新事件时间。
   * 没有点时为 null——「还没来过」和「延迟 0」不是一回事。
   */
  lagMs: number | null
  lagText: string
  /** 口径说明，必须显示在图上 */
  basis: string
  unit: string
  caption: string
  min: number
  max: number
}

export interface RealtimeOptions {
  /** 当前墙钟（epoch ms）。直播窗口的右端跟它走 */
  now: number
  /** 窗口时长。必须是正有限数 */
  windowMs: number
  /** 桶宽。必须是正有限数，且能整除窗口时长 */
  bucketMs: number
  /** 是否暂停。暂停时窗口右端钉在 freezeAt */
  paused?: boolean
  /**
   * 暂停时钉住的窗口右端。
   * 暂停却不给 freezeAt，整张图无效——否则各端会各自猜一个钉住的位置。
   */
  freezeAt?: number
  /** 已知的断流区间。与桶有交集且桶内无数值点 → 该桶为 gap */
  gaps?: readonly RealtimeGapInput[]
  /**
   * 缓存最多留多少个点。只限制点的数量，不定义窗口。
   * 超出时按事件时间从最老的那头丢掉。
   */
  maxPoints?: number
  unit?: string
}

const BASIS =
  '窗口按时间切开，桶宽固定；点按事件时间归桶，不按到达时间；断流是空档不是 0；暂停时窗口钉死'

const numberText = (n: number, unit: string) => {
  const text =
    n !== 0 && Math.abs(n) < 0.000001
      ? n.toExponential(3)
      : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 6 }).format(n)
  return `${text}${unit}`
}

const lagLabel = (ms: number) => {
  if (ms < 1000) return `延迟 ${Math.round(ms)} 毫秒`
  if (ms < 60_000) return `延迟 ${(ms / 1000).toFixed(1)} 秒`
  return `延迟 ${(ms / 60_000).toFixed(1)} 分钟`
}

function overlaps(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1
}

function invalid(base: RealtimeModel, caption: string): RealtimeModel {
  return {
    ...base,
    state: 'invalid',
    buckets: [],
    marks: [],
    late: [],
    lagMs: null,
    lagText: '—',
    min: 0,
    max: 1,
    caption
  }
}

/**
 * 把一串带事件时间的点收成一扇可直接渲染的时间滑窗。
 *
 * 不修改入参。窗口右端在直播时跟 now，暂停时钉在 freezeAt。
 */
export function buildRealtimeWindow(
  input: readonly RealtimePointInput[],
  options: RealtimeOptions
): RealtimeModel {
  const unit = options.unit ?? ''
  const base: RealtimeModel = {
    version: 1,
    state: 'empty',
    mode: 'time',
    paused: Boolean(options.paused),
    windowStart: 0,
    windowEnd: 0,
    bucketMs: 0,
    buckets: [],
    marks: [],
    late: [],
    excluded: [],
    lagMs: null,
    lagText: '—',
    basis: BASIS,
    unit,
    caption: '',
    min: 0,
    max: 1
  }

  const { now, windowMs, bucketMs } = options
  if (!Number.isFinite(now)) return invalid(base, '当前时间不是有效的数，窗口右端无从落笔')
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    return invalid(base, '窗口时长必须是正有限数——按条数切窗会让横轴含义跟着密度漂')
  }
  if (!Number.isFinite(bucketMs) || bucketMs <= 0) {
    return invalid(base, '桶宽必须是正有限数')
  }
  if (windowMs % bucketMs !== 0) {
    return invalid(base, '窗口时长必须能被桶宽整除，否则最边上会剩半个桶')
  }

  const paused = Boolean(options.paused)
  if (paused) {
    if (options.freezeAt === undefined || !Number.isFinite(options.freezeAt)) {
      return invalid(base, '暂停时必须给出钉住的窗口右端，否则各端会各自猜一个位置')
    }
  }

  const windowEnd = paused ? (options.freezeAt as number) : now
  const windowStart = windowEnd - windowMs
  const bucketCount = windowMs / bucketMs
  const maxPoints = options.maxPoints === undefined ? Infinity : options.maxPoints

  if (maxPoints !== Infinity && (!Number.isFinite(maxPoints) || maxPoints < 1 || !Number.isInteger(maxPoints))) {
    return invalid(base, '缓存上限必须是正整数——它只限制点数，不定义窗口')
  }

  const gaps = options.gaps ?? []
  for (const gap of gaps) {
    if (!Number.isFinite(gap.from) || !Number.isFinite(gap.to) || gap.to <= gap.from) {
      return invalid(base, '断流区间的起止必须是有限数，且止大于起')
    }
  }

  const seen = new Map<string, { point: RealtimePointInput; sourceIndex: number }>()
  const excluded: RealtimeModel['excluded'] = []

  input.forEach((point, sourceIndex) => {
    if (!point.id) {
      excluded.push({ id: `row-${sourceIndex}`, reason: '点的 ID 不能为空，否则无法去重与回溯', sourceIndex })
      return
    }
    if (!Number.isFinite(point.at)) {
      excluded.push({ id: point.id, reason: '事件时间不是有效的数，无法归桶', sourceIndex })
      return
    }
    if (point.value !== null && !Number.isFinite(point.value)) {
      excluded.push({ id: point.id, reason: '观测值不是有效的数（缺失请传 null，不是 NaN）', sourceIndex })
      return
    }
    // 同一 id 后写覆盖前写：重试与多路汇聚都靠这个收束
    seen.set(point.id, { point, sourceIndex })
  })

  // 按事件时间排，不按到达序——乱序到达时画出来的线才不会抖
  let points = [...seen.values()].sort((a, b) => a.point.at - b.point.at || a.sourceIndex - b.sourceIndex)

  const late: RealtimeModel['late'] = []
  const inOrAfterWindow: typeof points = []
  for (const row of points) {
    if (row.point.at < windowStart) {
      late.push({
        id: row.point.id,
        at: row.point.at,
        reason: '事件时间早于当前窗口左端，按事件时间本该落在已滑出的桶里'
      })
    } else {
      inOrAfterWindow.push(row)
    }
  }
  points = inOrAfterWindow

  // 缓存只留最近的 maxPoints 个：多出来的从最老的那头丢
  if (points.length > maxPoints) {
    const cut = points.length - maxPoints
    for (let i = 0; i < cut; i += 1) {
      const row = points[i]
      if (row.point.at < windowEnd) {
        late.push({
          id: row.point.id,
          at: row.point.at,
          reason: `缓存上限 ${maxPoints} 个点，更老的点被整点丢掉`
        })
      }
    }
    points = points.slice(cut)
  }

  const retained: typeof points = []
  for (const row of points) {
    if (row.point.at >= windowEnd) {
      late.push({
        id: row.point.id,
        at: row.point.at,
        reason: paused
          ? '暂停期间窗口已钉死，事件时间落在钉住右端之外的点不进当前窗'
          : '事件时间不早于窗口右端，无法归进当前窗的任何一个桶'
      })
    } else {
      retained.push(row)
    }
  }
  points = retained

  const buckets: RealtimeBucket[] = []
  const allMarks: RealtimeMark[] = []

  for (let index = 0; index < bucketCount; index += 1) {
    const start = windowStart + index * bucketMs
    const end = start + bucketMs
    const inBucket = points.filter((row) => row.point.at >= start && row.point.at < end)
    const numeric = inBucket.filter((row) => row.point.value !== null)
    const inGap = gaps.some((gap) => overlaps(start, end, gap.from, gap.to))

    const marks: RealtimeMark[] = []
    for (const row of inBucket) {
      if (!row.point.mark) continue
      const mark: RealtimeMark = {
        id: row.point.id,
        label: row.point.mark,
        at: row.point.at,
        bucketIndex: index,
        description: `${row.point.mark}（事件时间 ${row.point.at}）`
      }
      marks.push(mark)
      allMarks.push(mark)
    }

    if (numeric.length === 0 && inGap) {
      buckets.push({
        index,
        start,
        end,
        state: 'gap',
        value: null,
        valueText: '—',
        pointCount: inBucket.length,
        marks,
        description: `第 ${index + 1} 桶：断流空档，不是 0`
      })
      continue
    }

    // 连通且无点：合计是 0——「这段时间什么都没发生」与「这段时间线断了」不是一回事
    const value = numeric.reduce((sum, row) => sum + (row.point.value as number), 0)
    buckets.push({
      index,
      start,
      end,
      state: 'ready',
      value,
      valueText: numberText(value, unit),
      pointCount: inBucket.length,
      marks,
      description:
        numeric.length === 0
          ? `第 ${index + 1} 桶：已连通，合计 0${unit}（不是断流）`
          : `第 ${index + 1} 桶：${numeric.length} 个点合计 ${numberText(value, unit)}`
    })
  }

  const readyValues = buckets.filter((bucket) => bucket.state === 'ready').map((bucket) => bucket.value as number)
  const min = readyValues.length ? Math.min(0, ...readyValues) : 0
  const max = readyValues.length ? Math.max(0, ...readyValues) : 1
  const latest = points.reduce((acc, row) => Math.max(acc, row.point.at), Number.NEGATIVE_INFINITY)
  const lagMs = points.length ? Math.max(0, windowEnd - latest) : null

  const gapCount = buckets.filter((bucket) => bucket.state === 'gap').length
  const parts = [
    paused ? '已暂停' : '直播中',
    `${bucketCount} 个桶`,
    gapCount ? `${gapCount} 个断流空档` : null,
    late.length ? `${late.length} 个点未入窗` : null,
    excluded.length ? `${excluded.length} 个点未计入` : null,
    lagMs !== null ? lagLabel(lagMs) : '尚无事件'
  ].filter(Boolean)

  // 连一个有效点都没有、也没有断流空档可讲时，仍返回 ready 的空窗——
  // 空窗本身就是「这段时间什么都没发生」，不是无效。
  return {
    version: 1,
    state: 'ready',
    mode: 'time',
    paused,
    windowStart,
    windowEnd,
    bucketMs,
    buckets,
    marks: allMarks,
    late,
    excluded,
    lagMs,
    lagText: lagMs === null ? '尚无事件' : lagLabel(lagMs),
    basis: BASIS,
    unit,
    caption: parts.join(' · '),
    min,
    max: max === min ? min + 1 : max
  }
}
