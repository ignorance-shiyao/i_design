/**
 * 数值输入与滑块共用的取值规则。
 *
 * 步进、夹取、按精度取整这三件事在 InputNumber、Slider、Rate 上是同一套；
 * 分散实现的结果是同一个「库存」字段在两个页面有两种取整方式。
 */

/** 夹到闭区间内 */
export function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

/**
 * 按精度取整。
 * 浮点步进会产生 0.1 + 0.2 = 0.30000000000000004 这类值，
 * 不取整就会原样显示给用户。
 */
export function roundTo(value: number, precision = 0) {
  return Number(value.toFixed(precision))
}

/** 在区间内步进一次，同时完成夹取与取整 */
export function stepValue(
  current: number,
  step: number,
  min: number,
  max: number,
  precision = 0
) {
  return roundTo(clampNumber(current + step, min, max), precision)
}

/** 值 → 0~1 的比例，用于把数值映射成滑块位置 */
export function ratioOf(value: number, min: number, max: number) {
  if (max === min) return 0
  return clampNumber((value - min) / (max - min), 0, 1)
}

/**
 * 比例 → 值，并对齐到最近的步长。
 * 拖动滑块得到的是连续比例，但取值必须落在步长上，
 * 否则松手后显示的数字会带一长串小数。
 */
export function valueFromRatio(
  ratio: number,
  min: number,
  max: number,
  step: number,
  precision = 0
) {
  const raw = min + clampNumber(ratio, 0, 1) * (max - min)
  if (step <= 0) return roundTo(clampNumber(raw, min, max), precision)
  const snapped = min + Math.round((raw - min) / step) * step
  return roundTo(clampNumber(snapped, min, max), precision)
}
