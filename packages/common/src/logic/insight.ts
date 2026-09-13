/**
 * 洞察卡的纯逻辑。
 *
 * 洞察卡是「一段话 + 一条趋势线」：话由分析得出，线是它的依据。
 * 两件事必须落在公共层，否则各端会各给一个答案：
 *
 * - **翻到第几条**。分页在边界上的行为（到头了是停住还是绕回第一条）
 *   一旦各端各写一遍，同一份数据在手机上能翻回去、在网页上不能。
 * - **擦洗到第几个点**。手指或指针横向划过趋势线，读数跟着走。
 *   把 x 折算成下标这一步写错半个格宽，读数就永远比手指慢一格。
 */

/** 一条洞察。`series` 是支撑这句话的数据，不是装饰 */
export interface InsightItem {
  id: string
  title: string
  /** 结论本身。一句话说完，读者不该为了看懂它去点开别的东西 */
  summary: string
  series: number[]
  /** 横轴刻度。缺省时擦洗只报下标，读数会变成「第 3 个」这种没信息量的说法 */
  labels?: string[]
  /** 读数的单位，例如 `%`、`次`。跟在数字后面，不做本地化 */
  unit?: string
}

/**
 * 翻页后的下标。
 *
 * 到头就停住，不绕回第一条：洞察是有序的（通常按重要性排），
 * 绕回去会让人以为还有新的，实际是又看了一遍第一条。
 */
export function insightPage(count: number, current: number, delta: number): number {
  if (count <= 0) return 0
  const next = current + delta
  if (next < 0) return 0
  if (next > count - 1) return count - 1
  return next
}

/**
 * 端点标记圆的半径，以及为它留的边。
 *
 * 首尾两点画在图的正边上，标记圆就有一半落在画布外被裁掉——
 * 看着像最后一个点没画完。所以曲线整体往里缩一个半径再多一点。
 */
export const INSIGHT_DOT_R = 4
export const INSIGHT_INSET = INSIGHT_DOT_R + 1

/** 曲线实际可用的宽度与左边距。四端都按它缩，首尾的标记圆才都是整圆 */
export function insightPlot(width: number): { inner: number; inset: number } {
  const inset = Math.min(INSIGHT_INSET, width / 4)
  return { inner: Math.max(0, width - inset * 2), inset }
}

/**
 * 擦洗位置对应第几个点。
 *
 * 按「最近的点」判定而不是「落在第几段」：后者在两点之间来回移动时，
 * 读数会在离手指更远的那个点上停留半格，看着像慢了一拍。
 */
export function scrubIndex(x: number, width: number, count: number): number {
  if (count <= 1 || width <= 0) return 0
  const ratio = Math.min(1, Math.max(0, x / width))
  return Math.round(ratio * (count - 1))
}

/** 第 index 个点在图里的横坐标。与 scrubIndex 互为逆运算，读数标记才落在点上 */
export function scrubX(index: number, width: number, count: number): number {
  if (count <= 1) return 0
  return (index / (count - 1)) * width
}

/** 擦洗读数。没有标签时只给数值，不编一个「第几个」出来 */
export function scrubReadout(item: InsightItem, index: number): { label: string; value: string } {
  const value = item.series[index]
  const text = value === undefined ? '' : `${formatInsightValue(value)}${item.unit ?? ''}`
  return { label: item.labels?.[index] ?? '', value: text }
}

/** 读数的数字部分：整数不补小数位，小数最多一位——趋势线上的精度再多也读不出来 */
export function formatInsightValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** 一条洞察的涨跌 */
export interface InsightTrend {
  /** 相对首个点的变化量 */
  delta: number
  /** 变化百分比。首个点为 0 时没有百分比可言，给 null 而不是 Infinity */
  percent: number | null
  direction: 'up' | 'down' | 'flat'
}

/**
 * 首尾对比得出的涨跌。
 *
 * 只比首尾，不比最后两个点：洞察说的是「这段时间怎么样」，
 * 拿最后两个点作答会让一条整体上升、末尾抖了一下的曲线显示成下跌。
 */
export function insightTrend(series: number[]): InsightTrend {
  if (series.length < 2) return { delta: 0, percent: null, direction: 'flat' }
  const first = series[0]
  const last = series[series.length - 1]
  const delta = last - first
  return {
    delta,
    percent: first === 0 ? null : (delta / Math.abs(first)) * 100,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  }
}

/**
 * 涨跌的文字说明。
 *
 * 涨跌不能只靠箭头方向与红绿：色觉障碍用户与灰度打印读不出来，
 * 单看箭头也分不清「涨了多少」。这里给出的是要显示的那句话。
 */
export function trendLabel(trend: InsightTrend): string {
  if (trend.direction === 'flat') return '持平'
  const word = trend.direction === 'up' ? '上升' : '下降'
  if (trend.percent === null) return `${word} ${formatInsightValue(Math.abs(trend.delta))}`
  return `${word} ${formatInsightValue(Math.abs(trend.percent))}%`
}

/**
 * 涨跌对应的图标名。与 trendLabel 成对使用——图标是补充，不是唯一线索。
 *
 * 持平用 minus 而不是留空：留空的那一格会让读者以为数据没算出来。
 */
export function trendIcon(trend: InsightTrend): 'chevron-up' | 'chevron-down' | 'minus' {
  if (trend.direction === 'up') return 'chevron-up'
  if (trend.direction === 'down') return 'chevron-down'
  return 'minus'
}
