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
