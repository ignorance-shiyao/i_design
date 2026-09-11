/**
 * 下拉刷新的取值规则。
 *
 * 三件事每个端都要做，而且必须做得一样：手指拉了多远换算成内容下移多少、
 * 拉到哪里算「松手就刷新」、松手后停在哪。各端各写一遍的结果是
 * 同一个手势在 iOS 上刷得动、在小程序上刷不动。
 */

export type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing'

/** 触发刷新的阈值：小于它松手就弹回去 */
export const PULL_THRESHOLD = 56
/** 刷新中停留的高度，给指示器留出位置 */
export const PULL_LOADING_HEIGHT = 48
/** 最多能拉多远。再往下拉不动，避免整页被拖走 */
export const PULL_MAX = 120

/**
 * 阻尼：拉得越远越拉不动。
 *
 * 线性跟手的话，手指滑 300px 内容就下移 300px，像是页面散了，
 * 而且到头之后没有任何「拉不动了」的反馈。
 *
 * 用渐近曲线而不是平方根：平方根在起手那一小段会把位移放大——
 * 手指才动 10px 内容已经走了 17px，松手前就觉得页面在自己跑。
 * 这条曲线起手处斜率正好是 1（跟手），越往下越重，趋近 PULL_MAX 停住。
 */
export function pullDistance(rawDistance: number): number {
  if (rawDistance <= 0) return 0
  const damped = PULL_MAX * (1 - 1 / (rawDistance / PULL_MAX + 1))
  return Math.min(Math.round(damped), PULL_MAX)
}

/** 当前应当显示哪种状态。refreshing 由调用方持有，因此单独传入 */
export function pullState(distance: number, refreshing: boolean): PullState {
  if (refreshing) return 'refreshing'
  if (distance <= 0) return 'idle'
  return distance >= PULL_THRESHOLD ? 'ready' : 'pulling'
}

/** 松手后停在哪：够了就停在刷新高度，不够就弹回 0 */
export function pullRelease(distance: number): number {
  return distance >= PULL_THRESHOLD ? PULL_LOADING_HEIGHT : 0
}

/**
 * 指示器的旋转角度：跟着下拉进度转满一圈。
 * 到达阈值时正好转到 180°，这本身就是「可以松手了」的提示，不必只靠文案。
 */
export function pullRotate(distance: number): number {
  return Math.round(Math.min(distance / PULL_THRESHOLD, 1) * 180)
}
