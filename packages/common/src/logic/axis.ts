/**
 * 轴系：横向条形与双值轴（astra.md 的 D13）。
 *
 * 从 D03 拆出来，是因为百分比堆叠、阶梯、目标线都只是数据变换，
 * 四端共用一份就够；而横条与双轴要动坐标轴本身——轴的方向变了，
 * 网格、刻度、标签的摆放全跟着变，各端的绘制代码都要改。
 * 混在一个任务里，「做完了吗」根本说不清。
 *
 * 这里只出布局数字，不出任何 DOM 或 Canvas 指令，五端各自照着画。
 */
import { niceTicks } from './chart'

export type AxisOrientation = 'vertical' | 'horizontal'

export interface AxisTick {
  value: number
  label: string
  /** 沿值轴方向的像素位置：纵向是 y（自上而下），横向是 x（自左向右） */
  offset: number
}

export interface AxisLayout {
  orientation: AxisOrientation
  min: number
  max: number
  ticks: AxisTick[]
  /** 零值（或最接近零的下界）所在的像素位置，基线画在这里 */
  baseline: number
  /** 值轴的像素长度 */
  length: number
}

/**
 * 值轴布局。
 *
 * 纵向时值向上增长，所以像素位置要翻过来；横向时值向右增长，与像素同向。
 * 两者共用同一套刻度，横条与纵向柱的刻度密度才不会一个疏一个密。
 */
export function valueAxis(
  min: number,
  max: number,
  length: number,
  orientation: AxisOrientation = 'vertical',
  {
    tickCount = 5,
    format = (v: number) => String(v)
  }: { tickCount?: number; format?: (value: number) => string } = {}
): AxisLayout {
  const ticks = niceTicks(min, max, tickCount)
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const span = hi - lo || 1
  const at = (value: number) =>
    orientation === 'vertical'
      ? length - ((value - lo) / span) * length
      : ((value - lo) / span) * length

  return {
    orientation,
    min: lo,
    max: hi,
    length,
    ticks: ticks.map((value) => ({ value, label: format(value), offset: at(value) })),
    baseline: at(Math.max(lo, Math.min(hi, 0)))
  }
}

export interface CategoryBand {
  index: number
  /** 类目带的起点（纵向是 x，横向是 y） */
  start: number
  /** 类目带的长度 */
  size: number
  /** 带的中心，标签与单系列柱对齐到这里 */
  center: number
}

/** 类目轴：把类目轴的总长切成等宽的带，横纵一致 */
export function categoryBands(count: number, length: number): CategoryBand[] {
  const size = length / Math.max(1, count)
  return Array.from({ length: count }, (_, index) => ({
    index,
    start: index * size,
    size,
    center: index * size + size / 2
  }))
}

export interface BarRect {
  x: number
  y: number
  width: number
  height: number
  /** 值是否为负：负值条要从基线反向长出去，圆角也要换到另一头 */
  negative: boolean
}

/**
 * 一根柱（或一根横条）的矩形。
 *
 * 横纵两种方向只是把「沿值轴」和「沿类目轴」两个方向对调，因此用同一个函数出，
 * 免得两端各写一遍、各自漏掉负值或者堆叠的处理。
 */
export function barRect(
  {
    band,
    thickness,
    offsetInBand = 0
  }: { band: CategoryBand; thickness: number; offsetInBand?: number },
  { from, to }: { from: number; to: number },
  orientation: AxisOrientation
): BarRect {
  const along = band.start + offsetInBand
  const lo = Math.min(from, to)
  const size = Math.abs(to - from)
  return orientation === 'vertical'
    ? { x: along, y: lo, width: thickness, height: size, negative: to > from }
    : { x: lo, y: along, width: size, height: thickness, negative: to < from }
}

/**
 * 横条的排序：横条几乎总是用来做排名，乱序的横条读者会自己找最长的那根。
 * 保留原顺序是显式选择，不是默认。
 */
export function rankOrder(values: number[], direction: 'desc' | 'asc' | 'none' = 'desc'): number[] {
  const index = values.map((_, i) => i)
  if (direction === 'none') return index
  return index.sort((a, b) =>
    direction === 'desc' ? values[b] - values[a] : values[a] - values[b]
  )
}

export interface DualAxisSide {
  /** 归属这一侧的系列下标 */
  series: number[]
  /** 单位。双轴的前提是两侧单位不同，所以它是必填的 */
  unit: string
  label?: string
}

export interface DualAxisResult {
  left: AxisLayout
  right: AxisLayout
  /** 为什么这张图不该是双轴，或者读它时要注意什么。空数组表示没问题 */
  issues: string[]
  /** 两侧的零位是否落在同一像素高度上 */
  zeroAligned: boolean
}

/**
 * 双值轴。
 *
 * 双轴是最容易骗人的图型：两条线的交叉点、谁在上谁在下，全都由两侧刻度的
 * 取值决定，换一组刻度就能把结论反过来。所以这里不只出布局，还把不该用双轴的
 * 情形直接说出来：
 *
 * - 两侧单位相同 → 那是一个轴的事。用两个轴，等高就不再等值，读者会按位置比大小。
 * - 任一侧没写单位 → 读者无从判断右轴那条线在说什么量。
 * - 一侧跨零、另一侧不跨 → 零位对不齐，正负会看起来错位。
 *
 * 这些是提示不是拦截：调用方可能确实需要，但必须在界面上把话说清楚。
 */
export function dualAxis(
  series: { name: string; data: number[] }[],
  left: DualAxisSide,
  right: DualAxisSide,
  length: number,
  {
    orientation = 'vertical',
    tickCount = 5,
    format = (v: number) => String(v)
  }: { orientation?: AxisOrientation; tickCount?: number; format?: (value: number) => string } = {}
): DualAxisResult {
  const issues: string[] = []

  const valuesOf = (side: DualAxisSide) =>
    side.series.flatMap((i) => (series[i]?.data ?? []).filter((v) => Number.isFinite(v)))

  const leftValues = valuesOf(left)
  const rightValues = valuesOf(right)

  if (!left.unit.trim() || !right.unit.trim()) {
    issues.push('双轴的两侧都必须写明单位，否则读者无从判断另一条线在说什么量')
  } else if (left.unit.trim() === right.unit.trim()) {
    issues.push(
      `两侧单位都是「${left.unit}」，这是一个轴的事——分成两个轴之后等高不再等值，读者会按位置比大小`
    )
  }

  const unassigned = series
    .map((s, i) => i)
    .filter((i) => !left.series.includes(i) && !right.series.includes(i))
  if (unassigned.length) {
    issues.push(`有系列没有指定归属哪个轴：${unassigned.map((i) => series[i].name).join('、')}`)
  }

  const span = (values: number[]) => {
    if (!values.length) return { min: 0, max: 1 }
    const min = Math.min(0, ...values)
    const max = Math.max(...values)
    return { min, max: max === min ? min + 1 : max }
  }

  const l = span(leftValues)
  const r = span(rightValues)
  const leftAxis = valueAxis(l.min, l.max, length, orientation, { tickCount, format })
  const rightAxis = valueAxis(r.min, r.max, length, orientation, { tickCount, format })

  const zeroAligned = Math.abs(leftAxis.baseline - rightAxis.baseline) < 0.5
  if (!zeroAligned) {
    issues.push('两侧的零位不在同一条线上，正负看起来会错位——把其中一侧的范围调成对称可以对齐')
  }

  return { left: leftAxis, right: rightAxis, issues, zeroAligned }
}
