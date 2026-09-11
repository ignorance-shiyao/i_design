/**
 * 区间取值的共用规则。
 *
 * 「起大于止」这件事每个端都会遇到，而处理方式必须一致：
 * 一端自动对调、另一端标红报错的话，同一份数据在两端上得到的结果不同。
 */

export type RangeValue = [string, string]

/** 两端都为空才算空。只填了一头是「填了一半」，不是没填 */
export function isRangeEmpty(value: RangeValue): boolean {
  return !value[0] && !value[1]
}

/**
 * 起止对调。
 *
 * 只在两端都有值、且确实反了的时候动手——用户正在把「100」改成「10」的中途，
 * 数值会短暂地小于起点，这时对调会把他刚敲的字搬到另一个框里。
 * 因此这个函数只在失焦或提交时调用，不在输入过程中调用。
 */
export function orderRange(value: RangeValue, compare?: (a: string, b: string) => number): RangeValue {
  const [start, end] = value
  if (!start || !end) return value
  const cmp = compare ?? defaultCompare
  return cmp(start, end) > 0 ? [end, start] : value
}

/**
 * 默认比较：两端都是数字就按数字比，否则按字典序。
 * 日期字符串按 ISO 格式写时，字典序与时间序一致，因此不需要单独一条分支。
 */
function defaultCompare(a: string, b: string): number {
  const na = Number(a)
  const nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb ? 0 : na > nb ? 1 : -1
  return a === b ? 0 : a > b ? 1 : -1
}
