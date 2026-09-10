/**
 * 虚拟滚动的窗口计算。
 *
 * 万行表格不虚拟化就是万个 DOM 节点，滚动直接卡死。
 * 而虚拟化最容易写错的是「上下各多渲染几行」这件事：
 * 不多渲染，快速滚动时会看到空白；多渲染太多，又等于没虚拟化。
 */

export interface VirtualWindow {
  /** 要渲染的第一行下标 */
  start: number
  /** 要渲染的最后一行下标（含） */
  end: number
  /** 顶部撑开的高度，把可见行顶到正确位置 */
  paddingTop: number
  /** 底部撑开的高度，保证滚动条长度正确 */
  paddingBottom: number
  /** 内容总高，用于滚动条 */
  totalHeight: number
}

/**
 * 定高行的可见窗口。
 *
 * overscan 默认 3 行：再少，快速拖动滚动条时上下边缘会闪出空白；
 * 再多，收益已经没有了——多渲染的那些行永远来不及被看见。
 */
export function virtualWindow(
  scrollTop: number,
  viewportHeight: number,
  itemHeight: number,
  count: number,
  overscan = 3
): VirtualWindow {
  const totalHeight = itemHeight * count
  if (count <= 0 || itemHeight <= 0) {
    return { start: 0, end: -1, paddingTop: 0, paddingBottom: 0, totalHeight: 0 }
  }

  const first = Math.floor(scrollTop / itemHeight)
  const visible = Math.ceil(viewportHeight / itemHeight)
  const start = Math.max(0, first - overscan)
  const end = Math.min(count - 1, first + visible + overscan)

  return {
    start,
    end,
    paddingTop: start * itemHeight,
    // 底部撑开的必须按「剩下多少行」算，而不是总高减去已渲染的高度：
    // 后者在 start 被夹到 0 时会多算一截，滚动条比实际内容长一块
    paddingBottom: Math.max(0, (count - 1 - end) * itemHeight),
    totalHeight
  }
}

/**
 * 把某一行滚到视野里。
 *
 * 已经完整可见就不动——「定位到某行」时如果每次都把它滚到顶部，
 * 用户会觉得列表在自己乱跳，而他明明已经看得见那一行了。
 */
export function scrollToRow(
  index: number,
  itemHeight: number,
  scrollTop: number,
  viewportHeight: number
): number {
  const top = index * itemHeight
  const bottom = top + itemHeight
  if (top < scrollTop) return top
  if (bottom > scrollTop + viewportHeight) return bottom - viewportHeight
  return scrollTop
}

/** 内容是否足够多到值得虚拟化。太少时虚拟化只是徒增复杂度与一次布局计算 */
export function shouldVirtualize(count: number, threshold = 60): boolean {
  return count > threshold
}
