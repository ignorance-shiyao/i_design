/**
 * 下拉刷新的位移与状态。
 *
 * 「拉多远才算数、松手之后停在哪」这两件事写在组件里，各端会给出不同的手感：
 * 一端拉 40px 就触发、另一端要拉 120px，同一个 App 的两个端用起来不像一个东西。
 */

export type PullStatus = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'done'

/** 拉到这里松手才刷新。60px 大约是一个拇指的自然行程 */
export const PULL_THRESHOLD = 60
/** 最多能拉这么远。不封顶的话，用力一甩能把列表拽到屏幕外 */
export const PULL_MAX = 120

/**
 * 手指位移换成实际下拉距离，带阻尼。
 *
 * 一比一跟手是错的：越拉越沉才符合物理直觉，也才让人知道「快到头了」。
 * 线性跟手时，用户不松手就一直拉，最后整个列表被拽出屏幕，
 * 而他并不知道自己已经远远超过了触发线。
 *
 * 用 max·d/(max+d) 这条渐近曲线：
 *
 *   - 开头几乎跟手（拉 10px 走 9.2px），手感是「跟着的」；
 *   - 越往后越沉（拉 200px 只走 75px）；
 *   - 永远逼近 max 而到不了，因此不需要额外封顶——
 *     用 Math.min 硬截会在到顶那一刻突然停住，手指还在动而画面不动，
 *     那一下会被当成卡顿。
 *
 * 第一版写的是 sqrt(d)·sqrt(max)：拉 30px 列表走 60px，比手指还快——
 * 那是放大不是阻尼，而它照样能通过「有位移」「会封顶」这类粗测。
 */
export function pullDistance(delta: number, max = PULL_MAX): number {
  if (delta <= 0) return 0
  return (max * delta) / (max + delta)
}

/** 拉动过程中的状态：过了阈值就该改文案，让用户知道松手会发生什么 */
export function pullStatus(distance: number, threshold = PULL_THRESHOLD): PullStatus {
  if (distance <= 0) return 'idle'
  return distance >= threshold ? 'ready' : 'pulling'
}

/** 松手后是否要触发刷新 */
export function shouldRefresh(distance: number, threshold = PULL_THRESHOLD): boolean {
  return distance >= threshold
}

/**
 * 每个状态下显示什么文案。
 *
 * 文案与状态绑死在一处，各端不会一个写「下拉刷新」一个写「下拉可以刷新」。
 * 「松开立即刷新」这一句尤其要紧：它是唯一告诉用户「已经拉够了」的线索——
 * 不改文案的话，用户只能靠猜，通常会继续往下拉。
 */
export function pullHint(status: PullStatus): string {
  switch (status) {
    case 'pulling':
      return '下拉可以刷新'
    case 'ready':
      return '松开立即刷新'
    case 'refreshing':
      return '正在刷新…'
    case 'done':
      return '刷新完成'
    default:
      return ''
  }
}

/**
 * 刷新中头部停留的高度。
 *
 * 停在阈值处而不是收回零：收回零的话，加载指示器立刻消失，
 * 用户不知道刷新还在进行，会再拉一次。
 */
export function refreshingOffset(threshold = PULL_THRESHOLD): number {
  return threshold
}
