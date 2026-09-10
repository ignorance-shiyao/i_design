/**
 * 走马灯的翻页规则：滑动到底算不算翻页、翻到哪一张、指示点怎么显示。
 *
 * 这些判断在各端都要做一遍，写在各端就一定会分叉——同一份数据在 Web 上
 * 轻轻一划翻页了、在小程序上没翻，用户不会觉得是「两个实现」，只会觉得坏了。
 */

/** 触发翻页所需的位移，占容器宽度的比例 */
export const SWIPE_RATIO = 0.25
/** 快速轻扫的速度阈值，单位是「像素 / 毫秒」 */
export const SWIPE_VELOCITY = 0.35

export type SwipeDirection = -1 | 0 | 1

/**
 * 一次滑动该不该翻页，翻哪个方向。
 *
 * 位移与速度任一达标即可，而不是只看位移：
 * 只看位移时，快速的短促轻扫会被判成「没划够」——那恰恰是手机上最自然的手势，
 * 用户会反复用力划几次，然后认为这个轮播很迟钝。
 * 只看速度也不行：缓慢但确实拖过半屏的动作同样是明确的翻页意图。
 */
export function resolveSwipe(
  dx: number,
  width: number,
  durationMs: number,
  { ratio = SWIPE_RATIO, velocity = SWIPE_VELOCITY } = {}
): SwipeDirection {
  if (!width || !dx) return 0
  const far = Math.abs(dx) >= width * ratio
  const fast = durationMs > 0 && Math.abs(dx) / durationMs >= velocity
  if (!far && !fast) return 0
  // 手指往左划是「看下一张」，所以方向与位移符号相反
  return dx < 0 ? 1 : -1
}

/**
 * 翻页后的下标。
 *
 * loop 时首尾相接；不 loop 时停在两端而不是回绕——
 * 不循环的轮播突然从最后一张跳回第一张，读者会以为自己划错了方向。
 */
export function nextIndex(current: number, count: number, delta: number, loop = true): number {
  if (count <= 0) return 0
  const raw = current + delta
  if (loop) return ((raw % count) + count) % count
  return Math.min(count - 1, Math.max(0, raw))
}

/**
 * 当前应当显示的位移，单位是「张」。
 *
 * 拖动过程中把手指位移折算成小数张，这样每一帧都跟手；
 * 松手后由 nextIndex 决定落到哪一张，再由各端做回弹动画。
 */
export function trackOffset(index: number, dragDx: number, width: number): number {
  if (!width) return index
  return index - dragDx / width
}

/**
 * 不循环时，拖到两端要有阻尼。
 *
 * 到头了还能等距拖出去，看起来像「后面还有一张只是没加载」；
 * 打三折的阻尼既让人看出「到头了」，又不至于像卡住不动。
 */
export function rubberBand(offset: number, count: number, loop = true): number {
  if (loop || count <= 0) return offset
  const max = count - 1
  if (offset < 0) return offset * 0.3
  if (offset > max) return max + (offset - max) * 0.3
  return offset
}

export interface DotRange {
  /** 要渲染的点的下标 */
  items: number[]
  /** 这些点里哪一个是当前页 */
  active: number
}

/**
 * 指示点。超过上限就只显示当前页附近的一段。
 *
 * 二十张图配二十个点，点会小到看不清，也数不出自己在第几张；
 * 显示一个滑动窗口，读者至少能看出「还在中间」还是「快到头了」。
 */
export function dotRange(index: number, count: number, max = 7): DotRange {
  if (count <= max) return { items: Array.from({ length: count }, (_, i) => i), active: index }
  const half = Math.floor(max / 2)
  // 窗口贴住两端，不让它越过边界后留出空位
  const start = Math.min(Math.max(0, index - half), count - max)
  return { items: Array.from({ length: max }, (_, i) => start + i), active: index }
}

/**
 * 自动播放此刻该不该走。
 *
 * 悬停、聚焦、页面在后台、只有一张、用户要求减少动效——任一成立就停。
 * 后台标签页里继续翻页是纯粹的耗电，而且用户切回来时看到的是随机一张；
 * 聚焦时不停则会把正在用键盘阅读的人从当前这张上甩走。
 */
export function shouldAutoplay(state: {
  enabled: boolean
  count: number
  hovered?: boolean
  focused?: boolean
  dragging?: boolean
  documentHidden?: boolean
  reducedMotion?: boolean
}): boolean {
  return (
    state.enabled &&
    state.count > 1 &&
    !state.hovered &&
    !state.focused &&
    !state.dragging &&
    !state.documentHidden &&
    !state.reducedMotion
  )
}
