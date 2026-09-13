/**
 * 分割面板的尺寸计算。
 *
 * 「拖到底会怎样」这件事各端极容易给出不同答案：一端能把左栏拖没，
 * 另一端在 200px 处停住。而两种都说得通，所以必须只写一份。
 */

export interface SplitterPane {
  /** 最小尺寸，像素。拖到这里就停住 */
  min?: number
  /** 最大尺寸，像素 */
  max?: number
}

/**
 * 拖动后第一栏的新尺寸。
 *
 * 两栏的下限一起夹：只夹第一栏的话，把它拖到很大时第二栏会被挤到零宽，
 * 里面的内容全部换行成一列单字——那时用户已经看不出该往回拖多少了。
 */
export function resizePane(
  total: number,
  next: number,
  first: SplitterPane = {},
  second: SplitterPane = {},
  gutter = 4
): number {
  const usable = Math.max(0, total - gutter)
  const lowest = Math.max(first.min ?? 0, 0)
  // 第二栏的下限反过来就是第一栏的上限
  const highest = Math.min(first.max ?? usable, usable - (second.min ?? 0))
  if (highest < lowest) return lowest
  return Math.min(highest, Math.max(lowest, next))
}

/** 像素尺寸换成百分比，用于响应式布局下保持比例 */
export function paneRatio(size: number, total: number, gutter = 4): number {
  const usable = Math.max(1, total - gutter)
  return Math.min(1, Math.max(0, size / usable))
}

export function paneSize(ratio: number, total: number, gutter = 4): number {
  return Math.max(0, (total - gutter) * Math.min(1, Math.max(0, ratio)))
}

/**
 * 复位到指定比例后的实际尺寸。
 *
 * 复位不能直接把比例写回去：目标比例可能违反两栏的下限——
 * 容器变窄之后，「五五开」算出来的第一栏可能比 minFirst 还小。
 * 那样双击一下反而得到一个拖都拖不出来的状态。所以照样过一遍夹取。
 */
export function resetPaneSize(
  ratio: number,
  total: number,
  first: SplitterPane = {},
  second: SplitterPane = {},
  gutter = 4
): number {
  return resizePane(total, paneSize(ratio, total, gutter), first, second, gutter)
}

/**
 * 这个按键是不是「复位」。
 *
 * 双击分隔条是复位的常见手势，但双击对键盘使用者不存在，
 * 对只能单击的辅助设备也不存在。分隔条本来就可聚焦，
 * 在它上面按 Enter 或空格是同一个动作的键盘等价物。
 */
export function isSplitterResetKey(key: string): boolean {
  return key === 'Enter' || key === ' ' || key === 'Spacebar'
}

/**
 * 键盘调整的步长。
 *
 * 分隔条必须能用键盘拖——它是个真正的控件，不是装饰。
 * 只能鼠标拖的话，用键盘操作的人永远改不了这个布局。
 * 按住 Shift 走大步：一格一格挪到屏幕另一头要按上百次。
 */
export function keyboardStep(key: string, shift: boolean): number {
  const step = shift ? 48 : 8
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -step
  if (key === 'ArrowRight' || key === 'ArrowDown') return step
  return 0
}
