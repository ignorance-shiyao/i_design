/**
 * 数据集的规整、聚合与质量判定。
 *
 * 这一层只做一件事：把「数据本身有什么问题」变成明确的结论，
 * 而不是在渲染时悄悄抹平。抹平的写法都很短——`?? 0`、`filter(Boolean)`、
 * `Math.abs()`——每一个都会让图说出与数据不同的话：
 *
 *   - `?? 0` 把「这天没上报」画成「这天是 0」，趋势图上就是一次暴跌；
 *   - `filter(Boolean)` 顺手把 0 也丢了，柱状图上那根柱子直接消失；
 *   - 负数取绝对值，退款与收入长得一模一样。
 *
 * 所以缺失值一路保留成 null，由渲染层决定画成断点；问题单独列出来给图注。
 */
import type {
  Aggregation, CellValue, ChartDataset, ChartField, ChartSpec, DataIssue
} from '../contracts/chart'

/** 只有有限的数字才算数值；NaN 与 Infinity 一律按缺失处理 */
export const asNumber = (value: CellValue): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

export function fieldOf(dataset: ChartDataset, key: string): ChartField | undefined {
  return dataset.fields.find((f) => f.key === key)
}

/* ───────────────────────── 聚合 ───────────────────────── */

function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const index = (sorted.length - 1) * p
  const low = Math.floor(index)
  const high = Math.ceil(index)
  if (low === high) return sorted[low]
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low)
}

/**
 * 聚合一组值。
 *
 * 空集合返回 null 而不是 0——「这一组里没有数据」与「这一组加起来是 0」
 * 是两件事，画出来也该不一样。count 是唯一的例外：没有数据就是 0 条。
 */
export function aggregate(values: readonly (number | null)[], how: Aggregation = 'sum'): number | null {
  const numbers = values.filter((v): v is number => v !== null)
  if (how === 'count') return numbers.length
  if (!numbers.length) return null
  switch (how) {
    case 'sum': return numbers.reduce((a, b) => a + b, 0)
    case 'avg': return numbers.reduce((a, b) => a + b, 0) / numbers.length
    case 'min': return Math.min(...numbers)
    case 'max': return Math.max(...numbers)
    case 'median': return quantile([...numbers].sort((a, b) => a - b), 0.5)
    case 'p95': return quantile([...numbers].sort((a, b) => a - b), 0.95)
    default: return null
  }
}

/* ───────────────────────── 时间分桶 ───────────────────────── */

const DAY = 86_400_000

/**
 * 时间分桶。
 *
 * 按给定时区偏移分桶，而不是按浏览器所在时区：同一份日报在北京与柏林打开
 * 会落进不同的天，于是两个人看着同一张图讨论「上周三」，说的是不同的两天。
 * 不给偏移就按 UTC——那至少是个确定的答案。
 */
export function bucketStart(ms: number, bucket: NonNullable<ChartSpec['bucket']>, tzOffsetMinutes = 0): number {
  const shifted = ms + tzOffsetMinutes * 60_000
  const date = new Date(shifted)
  let start: number
  switch (bucket) {
    case 'hour':
      start = Math.floor(shifted / 3_600_000) * 3_600_000
      break
    case 'day':
      start = Math.floor(shifted / DAY) * DAY
      break
    case 'week': {
      // 周一为一周之始：ISO 的约定，也是国内排班的约定
      const day = (date.getUTCDay() + 6) % 7
      start = Math.floor(shifted / DAY) * DAY - day * DAY
      break
    }
    case 'month':
      start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
      break
    default:
      start = shifted
  }
  return start - tzOffsetMinutes * 60_000
}

/* ───────────────────────── 转成系列 ───────────────────────── */

export interface SeriesPoint {
  x: string | number
  /** null 表示这一点没有数据。不要在这里补 0 */
  y: number | null
}

export interface DatasetSeries {
  name: string
  unit?: string
  points: SeriesPoint[]
}

/**
 * 按 spec 把数据集折成若干系列。
 *
 * 分组键缺失时归到「未知」而不是丢掉：丢掉会让总数对不上，
 * 而读者算总数的频率比我们想象的高得多。
 */
export function toSeries(dataset: ChartDataset, spec: ChartSpec): DatasetSeries[] {
  const xField = fieldOf(dataset, spec.x)
  const isTime = xField?.kind === 'time'
  const tz = xField?.tzOffsetMinutes ?? 0

  const keyOf = (row: Record<string, CellValue>): string | number => {
    const raw = row[spec.x]
    if (isTime && typeof raw === 'number') {
      return spec.bucket ? bucketStart(raw, spec.bucket, tz) : raw
    }
    return raw === null || raw === undefined || raw === '' ? '未知' : (raw as string | number)
  }

  const groups = new Map<string, Map<string | number, (number | null)[]>>()
  const xOrder: (string | number)[] = []

  for (const row of dataset.rows) {
    const x = keyOf(row)
    if (!xOrder.includes(x)) xOrder.push(x)
    for (const measure of spec.y) {
      const groupValue = spec.groupBy ? row[spec.groupBy] : null
      const groupName = spec.groupBy
        ? (groupValue === null || groupValue === undefined || groupValue === '' ? '未知' : String(groupValue))
        : (fieldOf(dataset, measure)?.label ?? measure)
      const series = groups.get(groupName) ?? new Map()
      const bucketValues = series.get(x) ?? []
      bucketValues.push(asNumber(row[measure]))
      series.set(x, bucketValues)
      groups.set(groupName, series)
    }
  }

  // 时间轴按时间排序；分类轴保持出现顺序——重排会让「按金额降序」的表白排
  const axis = isTime ? [...xOrder].sort((a, b) => Number(a) - Number(b)) : xOrder

  return [...groups].map(([name, byX]) => ({
    name,
    unit: fieldOf(dataset, spec.y[0])?.unit,
    points: axis.map((x) => ({ x, y: aggregate(byX.get(x) ?? [], spec.aggregate ?? 'sum') }))
  }))
}

/* ───────────────────────── 数据质量 ───────────────────────── */

/**
 * 这份数据有什么值得说的问题。
 *
 * 不修数据，只把问题说出来：单点画不出趋势、全零多半是口径错了、
 * 混单位的两个系列不该共用一根轴。图注里写一句，比读者自己看出来早得多。
 */
export function dataIssues(dataset: ChartDataset, spec: ChartSpec): DataIssue[] {
  const issues: DataIssue[] = []
  const series = toSeries(dataset, spec)
  const values = series.flatMap((s) => s.points.map((p) => p.y))
  const numbers = values.filter((v): v is number => v !== null)

  if (!dataset.rows.length || !series.length) return [{ kind: 'empty' }]

  const xCount = series[0]?.points.length ?? 0
  if (xCount === 1) issues.push({ kind: 'single-point' })

  const missing = values.length - numbers.length
  if (missing > 0) issues.push({ kind: 'missing-values', count: missing })

  // NaN / Infinity 与「没上报」不是一回事：前者说明上游算错了，要单独报
  const invalid = dataset.rows.reduce((count, row) => count + spec.y.reduce((sum, key) => {
    const raw = row[key]
    return sum + (typeof raw === 'number' && !Number.isFinite(raw) ? 1 : 0)
  }, 0), 0)
  if (invalid > 0) issues.push({ kind: 'invalid-numbers', count: invalid })

  if (numbers.length && numbers.every((v) => v === 0)) issues.push({ kind: 'all-zero' })

  const negatives = numbers.filter((v) => v < 0).length
  if (negatives > 0) issues.push({ kind: 'has-negative', count: negatives })

  /*
   * 维度缺失同时看横轴与分组字段：分组字段缺失同样会让一批数据落进「未知」，
   * 而读者看到图例里多出一项「未知」时，第一反应是「这是什么」——
   * 图注里先说清有多少行。
   */
  const dimensionKeys = [spec.x, spec.groupBy].filter((key): key is string => Boolean(key))
  const missingDimension = dataset.rows.filter((row) =>
    dimensionKeys.some((key) => {
      const raw = row[key]
      return raw === null || raw === undefined || raw === ''
    })
  ).length
  if (missingDimension > 0) issues.push({ kind: 'missing-dimension', count: missingDimension })

  const units = [...new Set(spec.y.map((key) => fieldOf(dataset, key)?.unit ?? '').filter(Boolean))]
  if (units.length > 1) issues.push({ kind: 'mixed-units', units })

  return issues
}

/** 图注里的一句话。说人话，不说「存在 3 个 null」 */
export function issueText(issue: DataIssue): string {
  switch (issue.kind) {
    case 'empty': return '这段时间没有数据'
    case 'single-point': return '只有一个数据点，看不出趋势'
    case 'all-zero': return '全部为 0，先确认统计口径'
    case 'has-negative': return `有 ${issue.count} 个负值，柱状图会画到轴下方`
    case 'missing-values': return `有 ${issue.count} 个缺失值，画成断点而不是 0`
    case 'invalid-numbers': return `有 ${issue.count} 个非法数值（NaN 或无穷大），已按缺失处理`
    case 'missing-dimension': return `有 ${issue.count} 行缺少维度，已归入「未知」`
    case 'mixed-units': return `两个系列的单位不同（${issue.units.join(' / ')}），不该共用一根轴`
    default: return ''
  }
}

/* ───────────────────────── 与现有组件的适配 ───────────────────────── */

/**
 * 数据集 → 现有图表组件的 `series + labels`。
 *
 * 现有组件的属性不动：已经在用的页面不该因为多了一层数据集就得重写。
 * 缺失值在这里才不得不落成数字——组件的 data 是 number[]——
 * 所以同时返回 gaps，让调用方知道哪几个点是补出来的。
 */
export function toLegacySeries(dataset: ChartDataset, spec: ChartSpec): {
  labels: string[]
  series: { name: string; data: number[] }[]
  gaps: number[][]
} {
  const series = toSeries(dataset, spec)
  const xField = fieldOf(dataset, spec.x)
  /*
   * 时间标签要按字段自己的时区格式化。桶的起点存的是 UTC 毫秒，
   * 直接 toISOString 出来的是 UTC 那一天——东八区的「3 月 16 日」
   * 会被写成「3 月 15 日」，而这正是分桶时特意避开的那个错。
   */
  const tzOffset = xField?.tzOffsetMinutes ?? 0
  const labels = (series[0]?.points ?? []).map((p) =>
    xField?.kind === 'time'
      ? new Date(Number(p.x) + tzOffset * 60_000).toISOString().slice(0, 10)
      : String(p.x)
  )
  return {
    labels,
    series: series.map((s) => ({ name: s.name, data: s.points.map((p) => p.y ?? 0) })),
    gaps: series.map((s) => s.points.map((p, i) => (p.y === null ? i : -1)).filter((i) => i >= 0))
  }
}


/* ───────────────────────── 文本与表格出口 ───────────────────────── */

/**
 * 图的表格出口。
 *
 * 每张图都要有一条不看图也能拿到数的路：读屏用户读不了 SVG，
 * 色觉障碍用户分不清相邻两个系列，而任何人想把数抄进邮件时都需要它。
 *
 * 表格与图必须同源——都从 toSeries 出来。各算一遍的那种实现，
 * 迟早会在某次改聚合口径时只改一边，而对不上的两个数字比没有表格更糟。
 */
export function toTable(dataset: ChartDataset, spec: ChartSpec): {
  header: string[]
  rows: (string | number | null)[][]
} {
  const series = toSeries(dataset, spec)
  const xField = fieldOf(dataset, spec.x)
  const tzOffset = xField?.tzOffsetMinutes ?? 0
  const axis = (series[0]?.points ?? []).map((p) =>
    xField?.kind === 'time'
      ? new Date(Number(p.x) + tzOffset * 60_000).toISOString().slice(0, 10)
      : String(p.x)
  )
  return {
    header: [xField?.label ?? spec.x, ...series.map((s) => s.name)],
    // null 留在这里，由渲染层显示成「—」：写成 0 就等于在表格里也撒谎
    rows: axis.map((label, index) => [label, ...series.map((s) => s.points[index]?.y ?? null)])
  }
}

/** 转成 CSV。缺失值留空单元格，不是 0 */
export function toCsv(table: { header: string[]; rows: (string | number | null)[][] }): string {
  const cell = (value: string | number | null) => {
    if (value === null) return ''
    const text = String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [table.header, ...table.rows].map((row) => row.map(cell).join(',')).join('\n')
}

/**
 * 一句话说清这张图在说什么，给读屏与摘要用。
 *
 * 「一张折线图」对读屏用户毫无信息量。至少要有：几个系列、覆盖哪段、
 * 最高最低在哪儿。这段文字也是 alt 文本的来源。
 */
export function chartSummary(dataset: ChartDataset, spec: ChartSpec): string {
  const series = toSeries(dataset, spec)
  if (!series.length) return '没有数据'
  const table = toTable(dataset, spec)
  const first = table.rows[0]?.[0]
  const last = table.rows[table.rows.length - 1]?.[0]
  const parts = series.map((s) => {
    const numbers = s.points.filter((p) => p.y !== null) as { x: string | number; y: number }[]
    if (!numbers.length) return `${s.name}：没有数据`
    const top = numbers.reduce((a, b) => (b.y > a.y ? b : a))
    const low = numbers.reduce((a, b) => (b.y < a.y ? b : a))
    const unit = s.unit ?? ''
    return `${s.name}：最高 ${top.y}${unit}，最低 ${low.y}${unit}`
  })
  const range = first && last && first !== last ? `${first} 到 ${last}` : String(first ?? '')
  return `${range}，共 ${series.length} 个系列。${parts.join('；')}。`
}
