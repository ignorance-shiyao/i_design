/**
 * 图表计算：坐标轴刻度、比例尺、路径与扇区。
 *
 * 全部是纯函数，与渲染无关——Web 端用它生成 SVG 路径，小程序用它算 canvas 坐标，
 * Flutter 用同一套规则移植。「同一组数据在两个端上刻度不一样」因此不可能发生。
 */

export interface ChartSeries {
  name: string
  data: number[]
}

/**
 * 阈值标记：一条线（value）或一条带（from/to）。
 *
 * status 决定配色，走的是状态色而不是分类色——阈值不是「第 N 个系列」，
 * 借用分类色会让读者以为它也是一组数据。
 */
export interface ChartThreshold {
  /** 画一条线 */
  value?: number
  /** 画一条带；与 value 二选一 */
  from?: number
  to?: number
  label?: string
  status?: 'success' | 'warning' | 'danger'
}

/**
 * 生成「好看的」刻度值。
 *
 * 不直接把 min/max 等分：那会得到 0、13.7、27.4 这种刻度。
 * 这里把步长吸附到 1/2/5 的整数倍，坐标轴上出现的永远是人能心算的数。
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0]
  if (min === max) {
    // 所有值相同：给一个以该值为中心的区间，避免除以零
    const pad = Math.abs(min) || 1
    min -= pad
    max += pad
  }
  const rawStep = (max - min) / Math.max(1, count)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude

  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const ticks: number[] = []
  // 用乘法而不是累加：累加会让 0.1 这种步长积累浮点误差
  for (let i = 0; start + i * step <= end + step / 1000; i++) {
    ticks.push(Number((start + i * step).toFixed(10)))
  }
  return ticks
}

/** 数值域，通常从 0 起——柱状图不从 0 开始会放大差异，是最常见的误导 */
export function domainOf(series: ChartSeries[], { fromZero = true, stacked = false } = {}) {
  const values: number[] = []
  if (stacked && series.length) {
    const length = Math.max(...series.map((s) => s.data.length))
    for (let i = 0; i < length; i++) {
      values.push(series.reduce((sum, s) => sum + (s.data[i] ?? 0), 0))
    }
  } else {
    for (const s of series) values.push(...s.data.filter((v) => Number.isFinite(v)))
  }
  if (!values.length) return { min: 0, max: 1 }
  const min = fromZero ? Math.min(0, ...values) : Math.min(...values)
  const max = Math.max(...values)
  return { min, max: max === min ? min + 1 : max }
}

/** 把数值映射到像素坐标；y 轴向下，因此比例是反的 */
export const scaleY = (value: number, min: number, max: number, height: number) =>
  height - ((value - min) / (max - min)) * height

export const scaleX = (index: number, count: number, width: number) =>
  count <= 1 ? width / 2 : (index / (count - 1)) * width

/** 折线路径 */
export function linePath(data: number[], min: number, max: number, w: number, h: number) {
  return data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i, data.length, w).toFixed(2)} ${scaleY(v, min, max, h).toFixed(2)}`)
    .join(' ')
}

/** 面积路径：折线闭合到基线 */
export function areaPath(data: number[], min: number, max: number, w: number, h: number) {
  if (!data.length) return ''
  const base = scaleY(Math.max(min, 0), min, max, h).toFixed(2)
  return `${linePath(data, min, max, w, h)} L${scaleX(data.length - 1, data.length, w).toFixed(2)} ${base} L${scaleX(0, data.length, w).toFixed(2)} ${base} Z`
}

/**
 * 带状区域：两条折线之间的填充。
 *
 * 堆叠面积必须用它，而不是让每层都从零填到自己的累计值——
 * 那样几层半透明填充会叠在一起，看到的颜色是混合色而不是系列色，
 * 读者无法把某个色块对回图例。
 */
export function bandPath(
  lower: number[],
  upper: number[],
  min: number,
  max: number,
  w: number,
  h: number
) {
  if (!upper.length) return ''
  const top = upper
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i, upper.length, w).toFixed(2)} ${scaleY(v, min, max, h).toFixed(2)}`)
    .join(' ')
  const bottom = [...lower]
    .map((v, i) => ({ v, i }))
    .reverse()
    .map(({ v, i }) => `L${scaleX(i, lower.length, w).toFixed(2)} ${scaleY(v, min, max, h).toFixed(2)}`)
    .join(' ')
  return `${top} ${bottom} Z`
}

export interface PieSlice {
  value: number
  /** 起止角，单位弧度，12 点方向为 0，顺时针 */
  start: number
  end: number
  percent: number
  path: string
}

/**
 * 扇区路径。
 * innerRadius > 0 即为环形——环形比实心饼更容易比较，因为读者比的是弧长而不是面积。
 */
export function pieSlices(
  values: number[],
  radius: number,
  innerRadius = 0,
  center = { x: radius, y: radius }
): PieSlice[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0)
  if (total <= 0) return []

  let angle = -Math.PI / 2 // 从 12 点方向开始，与阅读习惯一致
  return values.map((value) => {
    const share = Math.max(0, value) / total
    const start = angle
    // 满值时收一点点，否则起止角相同，SVG 会画成一条线而不是整圆
    const end = angle + share * Math.PI * 2 * (share === 1 ? 0.9999 : 1)
    angle = end

    const point = (r: number, a: number) => `${(center.x + r * Math.cos(a)).toFixed(2)} ${(center.y + r * Math.sin(a)).toFixed(2)}`
    const large = end - start > Math.PI ? 1 : 0
    const path = innerRadius > 0
      ? `M${point(radius, start)} A${radius} ${radius} 0 ${large} 1 ${point(radius, end)} L${point(innerRadius, end)} A${innerRadius} ${innerRadius} 0 ${large} 0 ${point(innerRadius, start)} Z`
      : `M${center.x} ${center.y} L${point(radius, start)} A${radius} ${radius} 0 ${large} 1 ${point(radius, end)} Z`

    return { value, start, end, percent: share, path }
  })
}

/** 千分位与紧凑单位：坐标轴上 1200000 应当显示为 120万 而不是一串零 */
export function formatTick(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1e8) return `${Number((value / 1e8).toFixed(2))}亿`
  if (abs >= 1e4) return `${Number((value / 1e4).toFixed(2))}万`
  if (Number.isInteger(value)) return value.toLocaleString('zh-CN')
  return String(Number(value.toFixed(2)))
}

/* ---------- 其他图形 ---------- */

/**
 * 漏斗：每层画成上下宽度不同的梯形。
 *
 * 宽度按数值比例而不是按层级等差递减：等差看起来更"顺"，
 * 但那是画出来的顺，不是数据里的顺——转化率的落差正是要看的东西。
 */
export function funnelShapes(values: number[], width: number, height: number, gap = 4) {
  const max = Math.max(...values, 1)
  const rowH = (height - gap * (values.length - 1)) / Math.max(1, values.length)

  return values.map((value, i) => {
    const next = values[i + 1] ?? value
    const top = (value / max) * width
    const bottom = (next / max) * width
    const y = i * (rowH + gap)
    const points = [
      [(width - top) / 2, y],
      [(width + top) / 2, y],
      [(width + bottom) / 2, y + rowH],
      [(width - bottom) / 2, y + rowH]
    ]
    return {
      value,
      percent: values[0] ? value / values[0] : 0,
      /** 相对上一层的转化率——漏斗真正要回答的问题 */
      step: i === 0 ? 1 : values[i - 1] ? value / values[i - 1] : 0,
      points: points.map(([x, py]) => `${x.toFixed(2)},${py.toFixed(2)}`).join(' '),
      centerY: y + rowH / 2
    }
  })
}

/**
 * 仪表盘：起止角固定为下方开口的 220°。
 * 整圆会让"满值"与"零值"落在同一个位置，无法分辨。
 */
export function gaugeArc(percent: number, radius: number, stroke: number) {
  const START = Math.PI * 0.75
  const SWEEP = Math.PI * 1.5
  const clamped = Math.min(1, Math.max(0, percent))
  const r = radius - stroke / 2
  const point = (angle: number) => ({
    x: radius + r * Math.cos(angle),
    y: radius + r * Math.sin(angle)
  })
  const from = point(START)
  const to = point(START + SWEEP * clamped)
  const large = SWEEP * clamped > Math.PI ? 1 : 0
  const full = point(START + SWEEP)

  return {
    track: `M${from.x.toFixed(2)} ${from.y.toFixed(2)} A${r} ${r} 0 1 1 ${full.x.toFixed(2)} ${full.y.toFixed(2)}`,
    value: clamped === 0
      ? ''
      : `M${from.x.toFixed(2)} ${from.y.toFixed(2)} A${r} ${r} 0 ${large} 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`
  }
}

/** 雷达：每个维度一个顶点，按比例落在半径上 */
export function radarPoints(values: number[], max: number, radius: number) {
  const count = values.length
  return values.map((value, i) => {
    // 从 12 点方向开始顺时针分布，第一个维度永远在正上方
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 2
    const r = (Math.min(Math.max(value, 0), max) / max) * radius
    return {
      x: radius + r * Math.cos(angle),
      y: radius + r * Math.sin(angle),
      /** 轴线端点，用来画蛛网 */
      axisX: radius + radius * Math.cos(angle),
      axisY: radius + radius * Math.sin(angle)
    }
  })
}

/** 把点集连成闭合多边形路径 */
export const polygonPath = (points: { x: number; y: number }[]) =>
  points.length
    ? `${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} Z`
    : ''

/**
 * 热力图的色阶取值：把数值映射到单色阶的某一档。
 * 用单色阶而不是彩虹——彩虹会让读者以为颜色之间存在类别差异。
 */
export function heatLevel(value: number, min: number, max: number, steps = 5) {
  if (max === min) return 0
  const ratio = (value - min) / (max - min)
  return Math.min(steps - 1, Math.max(0, Math.round(ratio * (steps - 1))))
}

/** 第 n 个系列用第几号分类色；超过 8 个不再循环，返回 -1 由调用方合并处理 */
export function colorSlot(index: number, total = 8) {
  return index < total ? index + 1 : -1
}

/* ---------- 散点 ---------- */

export interface ScatterPoint {
  x: number
  y: number
  /** 气泡大小的原始值；不传则所有点同样大 */
  size?: number
  /** 悬停时显示的标识，例如项目名 */
  label?: string
}

export interface ScatterSeries {
  name: string
  data: ScatterPoint[]
}

/**
 * 散点图的系列上限是 3，这不是拍脑袋定的。
 *
 * 折线和柱状里只有相邻系列会挨在一起，散点则是任意两个点都可能贴着，
 * 因此配色必须按「所有两两组合」校验而不是「相邻组合」。本体系的分类色
 * 在这个更严的口径下，亮色与暗色两种模式都只有前三槽同时通过
 * （第四槽与品牌蓝的常色差 ΔE 只有 10.8，低于 15 的硬下限——
 * 就是色觉正常的人也难分辨）。
 *
 * 超出的系列不该靠「再调一个颜色」解决，那是把问题藏起来：
 * 合并成「其他」或者拆成多张小图，才是真的还能读。
 */
export const SCATTER_MAX_SERIES = 3

/** 一组点在某一维度上的值域 */
export function extentOf(points: ScatterPoint[], key: 'x' | 'y' | 'size') {
  const values = points.map((p) => p[key]).filter((v): v is number => Number.isFinite(v))
  if (!values.length) return { min: 0, max: 1 }
  const min = Math.min(...values)
  const max = Math.max(...values)
  return { min, max: max === min ? min + 1 : max }
}

/**
 * 气泡半径按面积映射，而不是按半径。
 *
 * 直接把数值当半径会让差异被平方放大：数值翻一倍，看上去是四倍大。
 * 视觉面积与数值成正比，读者估出来的比例才是对的。
 */
export function bubbleRadius(value: number, min: number, max: number, rMin = 4, rMax = 18) {
  if (max === min) return rMin
  const ratio = (Math.min(Math.max(value, min), max) - min) / (max - min)
  const aMin = Math.PI * rMin * rMin
  const aMax = Math.PI * rMax * rMax
  return Math.sqrt((aMin + ratio * (aMax - aMin)) / Math.PI)
}

/**
 * 最小二乘拟合的趋势线。
 *
 * 散点常见的问题是「看着像有关系，但说不清多强」——一条拟合线加上 R²
 * 就把这句话变成可核对的数字。点少于 3 个不拟合：两点连线必然 R²=1，
 * 那不是相关性，只是把两个点连起来。
 */
export function trendLine(points: ScatterPoint[]) {
  const pts = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  const n = pts.length
  if (n < 3) return null
  const sx = pts.reduce((a, p) => a + p.x, 0)
  const sy = pts.reduce((a, p) => a + p.y, 0)
  const sxx = pts.reduce((a, p) => a + p.x * p.x, 0)
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0)
  const denom = n * sxx - sx * sx
  // 所有点 x 相同：竖直方向没有斜率可言，拟合线没有意义
  if (denom === 0) return null
  const slope = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n
  const meanY = sy / n
  const ssTot = pts.reduce((a, p) => a + (p.y - meanY) ** 2, 0)
  const ssRes = pts.reduce((a, p) => a + (p.y - (slope * p.x + intercept)) ** 2, 0)
  return { slope, intercept, r2: ssTot === 0 ? 1 : 1 - ssRes / ssTot }
}

/* ---------- 箱线图 ---------- */

export interface BoxStats {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  /** 四分位距 */
  iqr: number
  /** 下须端点：1.5×IQR 内的最小实测值 */
  lower: number
  /** 上须端点：1.5×IQR 内的最大实测值 */
  upper: number
  /** 落在须之外的实测值 */
  outliers: number[]
}

/**
 * 分位数，线性插值（与 numpy 默认、Excel 的 QUARTILE.INC 一致）。
 *
 * 分位数有七八种定义，各端各挑一种就会得到不同的箱子——同一批数据在
 * Web 上中位线在这里、Flutter 上在那里。因此定义写死在这里，不留选项。
 */
export function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN
  if (sorted.length === 1) return sorted[0]
  const pos = (sorted.length - 1) * Math.min(1, Math.max(0, p))
  const low = Math.floor(pos)
  const high = Math.ceil(pos)
  if (low === high) return sorted[low]
  return sorted[low] + (sorted[high] - sorted[low]) * (pos - low)
}

/**
 * 箱线图的五数概括与离群点。
 *
 * 须延伸到 1.5×IQR 范围内的**实测值**，而不是直接画到 q1−1.5×IQR 的位置——
 * 后者会让须端出现一个数据里根本不存在的数，读者却会把它当成实际的最小值。
 */
export function boxStats(values: number[]): BoxStats {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (!sorted.length) {
    return { min: NaN, q1: NaN, median: NaN, q3: NaN, max: NaN, iqr: NaN, lower: NaN, upper: NaN, outliers: [] }
  }
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  const lowFence = q1 - 1.5 * iqr
  const highFence = q3 + 1.5 * iqr
  const inside = sorted.filter((v) => v >= lowFence && v <= highFence)
  return {
    min: sorted[0],
    q1,
    median,
    q3,
    max: sorted[sorted.length - 1],
    iqr,
    lower: inside.length ? inside[0] : sorted[0],
    upper: inside.length ? inside[inside.length - 1] : sorted[sorted.length - 1],
    outliers: sorted.filter((v) => v < lowFence || v > highFence)
  }
}

/* ---------- 瀑布图 ---------- */

export interface WaterfallItem {
  label: string
  /** 增减量；total 项忽略此值 */
  value: number
  /** 小计/总计：从 0 画到累计值，而不是接着上一根 */
  total?: boolean
}

export interface WaterfallBar {
  label: string
  /** 柱子的起止值（数据坐标，非像素） */
  start: number
  end: number
  /** 该项本身的增减量 */
  delta: number
  kind: 'increase' | 'decrease' | 'total'
}

/**
 * 把增减序列摊成柱子的起止值。
 *
 * 涨跌用极性配色（发散色两端）而不是状态色的绿/红：
 * 收入增加是好事、成本增加是坏事，「增加」本身并没有好坏，
 * 用状态色会把一个中性的方向读成评价。
 */
export function waterfallBars(items: WaterfallItem[]): WaterfallBar[] {
  let cumulative = 0
  return items.map((item) => {
    if (item.total) {
      // 总计柱从 0 起画：它表示的是绝对量，不是又一次增减
      return { label: item.label, start: 0, end: cumulative, delta: cumulative, kind: 'total' as const }
    }
    const start = cumulative
    cumulative += item.value
    return {
      label: item.label,
      start,
      end: cumulative,
      delta: item.value,
      kind: item.value >= 0 ? ('increase' as const) : ('decrease' as const)
    }
  })
}

/** 瀑布图的值域：要把所有柱子的起止都包进去，否则中间某根会被截断 */
export function waterfallDomain(bars: WaterfallBar[]): [number, number] {
  if (!bars.length) return [0, 1]
  const all = bars.flatMap((b) => [b.start, b.end])
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  return min === max ? [min, min + 1] : [min, max]
}

/* ---------- 区间缩放（dataZoom） ---------- */

export interface ZoomWindow {
  /** 起止下标，闭区间 */
  start: number
  end: number
}

/**
 * 把窗口夹回合法范围。
 *
 * 三件事必须一起处理，分开写就会漏：
 *   1. 起止越界要夹回 [0, count-1]
 *   2. 起 > 止 时交换——拖动左手柄越过右手柄是很自然的操作，
 *      不交换的话窗口会变成负宽度，图表直接空掉
 *   3. 宽度不得小于 minSpan：缩到零宽等于把图表擦掉，而用户无法再拖回来
 */
export function clampWindow(win: ZoomWindow, count: number, minSpan = 2): ZoomWindow {
  if (count <= 0) return { start: 0, end: 0 }
  const max = count - 1
  const span = Math.max(1, Math.min(minSpan, count) - 1)

  let start = Math.round(Math.min(Math.max(win.start, 0), max))
  let end = Math.round(Math.min(Math.max(win.end, 0), max))
  if (start > end) [start, end] = [end, start]

  if (end - start < span) {
    // 优先向右补足；右边不够了再向左补，保证贴边时仍能满足最小宽度
    end = start + span
    if (end > max) {
      end = max
      start = Math.max(0, end - span)
    }
  }
  return { start, end }
}

/** 由 0–1 的比例得到窗口，用于把拖拽像素换成下标 */
export function windowFromRatio(from: number, to: number, count: number, minSpan = 2): ZoomWindow {
  const max = Math.max(0, count - 1)
  return clampWindow({ start: from * max, end: to * max }, count, minSpan)
}

/**
 * 整体平移窗口，宽度保持不变。
 *
 * 到边界时只停住、不压缩——压缩会让用户在拖到头之后继续拖时，
 * 窗口悄悄变窄，松手才发现范围变了。
 */
export function panWindow(win: ZoomWindow, delta: number, count: number): ZoomWindow {
  const width = win.end - win.start
  const max = Math.max(0, count - 1)
  let start = Math.round(win.start + delta)
  if (start < 0) start = 0
  if (start + width > max) start = max - width
  return { start: Math.max(0, start), end: Math.max(0, start + width) }
}

/** 按窗口切数据；越界由 clampWindow 兜住，这里只做切片 */
export function sliceByWindow<T>(items: T[], win: ZoomWindow): T[] {
  return items.slice(win.start, win.end + 1)
}

/** 窗口占全量的比例，用于渲染缩略条上的选框位置 */
export function windowRatio(win: ZoomWindow, count: number): { from: number; to: number } {
  const max = Math.max(1, count - 1)
  return { from: win.start / max, to: win.end / max }
}

/**
 * 轴标签的抽稀步长。
 *
 * 标签一多就会互相压住，糊成一条黑边——那既读不出内容，
 * 也让人误以为轴上有一根粗线。按可用宽度算出每隔几个画一个：
 * 只保证相邻两个标签之间至少留出 minGap 的距离。
 *
 * 返回 1 表示全部都画得下。
 */
export function labelStep(count: number, width: number, minGap = 48): number {
  if (count <= 1 || width <= 0) return 1
  const per = width / count
  if (per >= minGap) return 1
  return Math.ceil(minGap / per)
}

/**
 * 该下标的标签要不要画。
 *
 * 末尾那个总是画：读者要知道序列到哪儿为止，
 * 而按步长抽稀时它常常正好被跳过。
 */
export function showLabelAt(index: number, count: number, step: number): boolean {
  if (step <= 1) return true
  if (index === count - 1) return true
  // 末尾附近若与最后一个挨得太近就让位，避免两个标签叠在一起
  if (count - 1 - index < step / 2) return false
  return index % step === 0
}

/* ---------- 桑基图 ---------- */

export interface SankeyLink {
  from: string
  to: string
  value: number
}

export interface SankeyNode {
  key: string
  label: string
  /** 所在层级，由拓扑决定而不是由调用方指定 */
  depth: number
  value: number
  x: number
  y: number
  width: number
  height: number
}

/** 缎带的四个角。canvas 端（小程序 / Flutter）画不了 SVG path，直接用这些坐标 */
export interface SankeyRibbonAnchor {
  x: number
  top: number
  bottom: number
}

export interface SankeyRibbon {
  from: string
  to: string
  value: number
  source: SankeyRibbonAnchor
  target: SankeyRibbonAnchor
  /** 控制点的横坐标，两端共用——canvas 的 bezierCurveTo 与 SVG 的 C 指令是同一条曲线 */
  controlX: number
  path: string
}

export interface SankeyLayout {
  nodes: SankeyNode[]
  ribbons: SankeyRibbon[]
}

/**
 * 节点分层：从没有入边的节点开始，逐层向后推。
 *
 * 用最长路径而不是最短：一个节点只要还有上游没排完，就不能定层，
 * 否则它会被排到上游前面，流向看起来是倒着的。
 * 存在环时以已访问集合截断——环在流量图里本就无法分层，
 * 与其抛错不如把回边忽略掉，剩下的部分仍然能画。
 */
function sankeyDepths(links: SankeyLink[]): Map<string, number> {
  const outgoing = new Map<string, string[]>()
  const indegree = new Map<string, number>()
  const keys = new Set<string>()

  for (const link of links) {
    keys.add(link.from)
    keys.add(link.to)
    if (!outgoing.has(link.from)) outgoing.set(link.from, [])
    outgoing.get(link.from)!.push(link.to)
    indegree.set(link.to, (indegree.get(link.to) ?? 0) + 1)
    if (!indegree.has(link.from)) indegree.set(link.from, 0)
  }

  const depth = new Map<string, number>()
  for (const key of keys) depth.set(key, 0)

  const queue = [...keys].filter((k) => (indegree.get(k) ?? 0) === 0)
  const visited = new Set<string>(queue)
  // 上限兜底：数据里有环时不至于转不出来
  let guard = keys.size * keys.size + 16

  while (queue.length && guard-- > 0) {
    const current = queue.shift()!
    for (const next of outgoing.get(current) ?? []) {
      const candidate = (depth.get(current) ?? 0) + 1
      if (candidate > (depth.get(next) ?? 0)) depth.set(next, candidate)
      if (!visited.has(next)) {
        visited.add(next)
        queue.push(next)
      } else {
        // 已访问过的重新入队，让更长的路径能把它推到更后面
        queue.push(next)
      }
    }
  }
  return depth
}

/**
 * 桑基图布局。
 *
 * 节点高度按流量占比分配，而不是等分：等分会让一条极小的支流
 * 和主干看起来一样粗，那正是桑基图要避免的误读。
 */
export function sankeyLayout(
  links: SankeyLink[],
  width: number,
  height: number,
  { nodeWidth = 12, nodePadding = 12, labels = {} as Record<string, string> } = {}
): SankeyLayout {
  if (!links.length) return { nodes: [], ribbons: [] }

  const depth = sankeyDepths(links)
  const maxDepth = Math.max(0, ...depth.values())

  // 每个节点的流量取「进出两侧的较大值」：只算一侧会让末端节点厚度为零
  const inflow = new Map<string, number>()
  const outflow = new Map<string, number>()
  for (const link of links) {
    outflow.set(link.from, (outflow.get(link.from) ?? 0) + link.value)
    inflow.set(link.to, (inflow.get(link.to) ?? 0) + link.value)
  }
  const valueOf = (key: string) => Math.max(inflow.get(key) ?? 0, outflow.get(key) ?? 0)

  const byDepth = new Map<number, string[]>()
  for (const [key, d] of depth) {
    if (!byDepth.has(d)) byDepth.set(d, [])
    byDepth.get(d)!.push(key)
  }

  // 层内按流量从大到小排，主干在上，读者的视线不必来回跳
  for (const list of byDepth.values()) list.sort((a, b) => valueOf(b) - valueOf(a))

  const columnGap = maxDepth > 0 ? (width - nodeWidth) / maxDepth : 0
  const nodes: SankeyNode[] = []
  const box = new Map<string, SankeyNode>()

  for (const [d, list] of byDepth) {
    const total = list.reduce((sum, k) => sum + valueOf(k), 0) || 1
    const available = height - nodePadding * Math.max(0, list.length - 1)
    let y = 0
    for (const key of list) {
      const h = Math.max(2, (valueOf(key) / total) * available)
      const node: SankeyNode = {
        key,
        label: labels[key] ?? key,
        depth: d,
        value: valueOf(key),
        x: d * columnGap,
        y,
        width: nodeWidth,
        height: h
      }
      nodes.push(node)
      box.set(key, node)
      y += h + nodePadding
    }
  }

  /*
   * 缎带：两端各自按流量占比在节点上取一段，用三次贝塞尔连起来。
   * 控制点放在两端的水平中点，曲线才会平顺地进出节点，
   * 而不是斜插进去——斜插会让人误以为它连的是相邻的另一个节点。
   */
  const usedFrom = new Map<string, number>()
  const usedTo = new Map<string, number>()
  const ribbons: SankeyRibbon[] = []

  for (const link of links) {
    const a = box.get(link.from)
    const b = box.get(link.to)
    if (!a || !b) continue

    const aShare = (link.value / Math.max(1, outflow.get(link.from) ?? 1)) * a.height
    const bShare = (link.value / Math.max(1, inflow.get(link.to) ?? 1)) * b.height
    const ay = a.y + (usedFrom.get(link.from) ?? 0)
    const by = b.y + (usedTo.get(link.to) ?? 0)
    usedFrom.set(link.from, (usedFrom.get(link.from) ?? 0) + aShare)
    usedTo.set(link.to, (usedTo.get(link.to) ?? 0) + bShare)

    const x0 = a.x + a.width
    const x1 = b.x
    const cx = (x0 + x1) / 2
    const path = [
      `M${x0.toFixed(2)} ${ay.toFixed(2)}`,
      `C${cx.toFixed(2)} ${ay.toFixed(2)} ${cx.toFixed(2)} ${by.toFixed(2)} ${x1.toFixed(2)} ${by.toFixed(2)}`,
      `L${x1.toFixed(2)} ${(by + bShare).toFixed(2)}`,
      `C${cx.toFixed(2)} ${(by + bShare).toFixed(2)} ${cx.toFixed(2)} ${(ay + aShare).toFixed(2)} ${x0.toFixed(2)} ${(ay + aShare).toFixed(2)}`,
      'Z'
    ].join(' ')

    ribbons.push({
      from: link.from,
      to: link.to,
      value: link.value,
      source: { x: x0, top: ay, bottom: ay + aShare },
      target: { x: x1, top: by, bottom: by + bShare },
      controlX: cx,
      path
    })
  }

  return { nodes, ribbons }
}

/* ---------- 矩形树图 ---------- */

export interface TreemapItem {
  label: string
  value: number
}

export interface TreemapTile {
  label: string
  value: number
  percent: number
  x: number
  y: number
  width: number
  height: number
}

/**
 * 矩形树图布局，squarify 算法。
 *
 * 不用简单的「切条」布局：那会产出又长又细的矩形，
 * 而人眼比较细长条的面积极不准——那正是矩形树图要表达的东西。
 * squarify 每次都挑让长宽比最接近 1 的切法。
 */
export function treemapLayout(
  items: TreemapItem[],
  width: number,
  height: number
): TreemapTile[] {
  const valid = items.filter((i) => i.value > 0)
  if (!valid.length || width <= 0 || height <= 0) return []

  const total = valid.reduce((sum, i) => sum + i.value, 0)
  // 面积按比例缩放到画布，之后所有计算都在面积域里做
  const scaled = [...valid]
    .sort((a, b) => b.value - a.value)
    .map((i) => ({ ...i, area: (i.value / total) * width * height }))

  const tiles: TreemapTile[] = []
  let x = 0
  let y = 0
  let w = width
  let h = height
  let row: typeof scaled = []
  let index = 0

  /** 一行的最差长宽比：越接近 1 越好 */
  const worst = (items: typeof scaled, side: number) => {
    if (!items.length) return Infinity
    const sum = items.reduce((s, i) => s + i.area, 0)
    const max = Math.max(...items.map((i) => i.area))
    const min = Math.min(...items.map((i) => i.area))
    const side2 = side * side
    const sum2 = sum * sum
    return Math.max((side2 * max) / sum2, sum2 / (side2 * min))
  }

  const flush = () => {
    if (!row.length) return
    const sum = row.reduce((s, i) => s + i.area, 0)
    const horizontal = w >= h
    // 沿短边排一行，这样每块才不至于被拉成长条
    const thickness = horizontal ? sum / h : sum / w
    let offset = 0
    for (const item of row) {
      const length = horizontal ? item.area / thickness : item.area / thickness
      tiles.push({
        label: item.label,
        value: item.value,
        percent: item.value / total,
        x: horizontal ? x : x + offset,
        y: horizontal ? y + offset : y,
        width: horizontal ? thickness : length,
        height: horizontal ? length : thickness
      })
      offset += length
    }
    if (horizontal) {
      x += thickness
      w -= thickness
    } else {
      y += thickness
      h -= thickness
    }
    row = []
  }

  while (index < scaled.length) {
    const side = Math.min(w, h)
    const next = scaled[index]
    if (!row.length || worst([...row, next], side) <= worst(row, side)) {
      row.push(next)
      index += 1
    } else {
      flush()
    }
  }
  flush()

  return tiles
}
