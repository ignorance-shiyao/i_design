/**
 * 悬浮操作按钮的展开几何。
 *
 * 展开后每个动作离主按钮多远，各端都要算一遍：Web 用 transform，
 * 小程序用内联样式，Flutter 用 Offset。间距与顺序写在各端的话，
 * 同一个组件在三端会错开几像素——这种偏差没人会当成 bug 报，只会觉得「有点糙」。
 */

export interface FloatAction {
  key: string
  /** 图标名，取自共享图标表 */
  icon?: string
  /** 文字说明，同时用作无障碍名——颜色与位置都不能替代它 */
  label: string
}

/** 主按钮直径 */
export const FLOAT_BUTTON_SIZE = 48
/** 动作按钮直径：比主按钮小一圈，层级一眼可辨 */
export const FLOAT_ACTION_SIZE = 40
/** 相邻两个之间的空隙 */
export const FLOAT_ACTION_GAP = 12

/**
 * 第 index 个动作距主按钮中心的距离（像素）。
 *
 * 从 1 开始往外排：第一个动作要先跨过主按钮的半径与自己的半径，再加一个空隙，
 * 之后每个再加一整个动作直径与空隙。直接用 `(index + 1) * 56` 这类魔数
 * 在改尺寸时必然漏掉一处。
 */
export function floatActionOffset(index: number): number {
  const first = FLOAT_BUTTON_SIZE / 2 + FLOAT_ACTION_GAP + FLOAT_ACTION_SIZE / 2
  return first + index * (FLOAT_ACTION_SIZE + FLOAT_ACTION_GAP)
}

/**
 * 第 index 个动作相对「与主按钮同底对齐」这个起点要挪多远（像素）。
 *
 * `floatActionOffset` 给的是两个圆心之间的距离，而各端摆放时的起点都是底边对齐
 * ——Web 用 translateY，Flutter 用 Positioned.bottom，都是从底边算的。
 * 两者差着半个直径之差：直接拿圆心距去当位移，整排动作会统一偏低 4px，
 * 肉眼看不出，量一下就跑出来了（这正是第一次接上去时的症状）。
 */
export function floatActionShift(index: number): number {
  return floatActionOffset(index) + (FLOAT_BUTTON_SIZE - FLOAT_ACTION_SIZE) / 2
}

/**
 * 展开动画里第 index 个动作的延迟（毫秒）。
 *
 * 依次弹出而不是一起冒出来：一起出现时用户得重新扫一遍才知道有几个，
 * 逐个出现则视线跟着走，读完就知道了。总时长压在 150ms 内，
 * 再长就从「跟手」变成「等它」。
 */
export function floatActionDelay(index: number, count: number): number {
  if (count <= 1) return 0
  return Math.round((index * 150) / count)
}
