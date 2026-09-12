/**
 * 文本有没有真的被截断。
 *
 * 「溢出了才给提示」听起来只是一次比较，实际有两处各端最容易各写各的：
 * 比哪个方向，以及容差留多少。写错了不会报错，只会让提示一直不出现，
 * 或者每一行短文案都挂着一个多余的浮层。
 */

export interface OverflowMetrics {
  scrollWidth: number
  clientWidth: number
  scrollHeight: number
  clientHeight: number
}

/**
 * 亚像素容差。
 *
 * 布局宽高是小数，scrollWidth 与 clientWidth 各自取整的方向不一定相同，
 * 于是没截断的文字也能差出零点几像素。不留容差的话，一整列短文案会全都挂上提示，
 * 鼠标扫过去一路冒浮层。
 */
export const OVERFLOW_EPSILON = 1

/**
 * 单行看宽度，多行看高度。
 *
 * 这是最容易写歪的一处：多行截断（line-clamp）永远不会横向溢出，
 * 拿宽度去判断的话条件永远不成立，提示一次都不会出现——而且不报错，
 * 只是「这个功能好像没做」。
 */
export function isTextOverflowing(metrics: OverflowMetrics, multiline = false): boolean {
  if (multiline) return metrics.scrollHeight - metrics.clientHeight > OVERFLOW_EPSILON
  return metrics.scrollWidth - metrics.clientWidth > OVERFLOW_EPSILON
}
