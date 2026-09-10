/**
 * 吸附与回到顶部的滚动判定。
 *
 * 「什么时候该吸住」「什么时候该露出回到顶部」这两件事各端都要算一遍，
 * 而算错的表现都很轻微——吸早了半屏、按钮闪一下就没——没人会当成缺陷报上来，
 * 但用起来就是不对。
 */

export interface AffixMetrics {
  /** 元素在文档中的原始位置（未吸附时） */
  offsetTop: number
  /** 元素自身高度 */
  height: number
  scrollTop: number
  viewportHeight: number
  /** 容器底部在文档中的位置，用于「跟着容器一起离场」 */
  containerBottom?: number
}

export type AffixMode = 'none' | 'top' | 'bottom'

export interface AffixState {
  mode: AffixMode
  /** 吸住时距离视口顶/底的偏移 */
  offset: number
}

/**
 * 该不该吸住，吸在哪一边。
 *
 * 容器底部先于元素滚出视口时，元素要跟着一起走，而不是继续钉在顶上——
 * 一个已经和内容无关的浮块钉在屏幕顶端，读者会以为它属于下一节。
 */
export function resolveAffix(
  metrics: AffixMetrics,
  { top, bottom }: { top?: number; bottom?: number } = {}
): AffixState {
  if (typeof bottom === 'number') {
    const elementBottom = metrics.offsetTop + metrics.height
    const viewportBottom = metrics.scrollTop + metrics.viewportHeight
    return elementBottom > viewportBottom - bottom
      ? { mode: 'bottom', offset: bottom }
      : { mode: 'none', offset: 0 }
  }

  const threshold = typeof top === 'number' ? top : 0
  if (metrics.scrollTop + threshold <= metrics.offsetTop) return { mode: 'none', offset: 0 }

  // 容器要走了就跟着走：把元素往上顶，而不是让它继续钉着
  if (typeof metrics.containerBottom === 'number') {
    const stickyBottom = metrics.scrollTop + threshold + metrics.height
    if (stickyBottom > metrics.containerBottom) {
      return { mode: 'top', offset: threshold - (stickyBottom - metrics.containerBottom) }
    }
  }
  return { mode: 'top', offset: threshold }
}

/**
 * 回到顶部按钮该不该露出来。
 *
 * 阈值默认一屏：滚动不足一屏时，用户自己往回划两下就到顶了，
 * 这时冒出一个按钮属于帮倒忙——它遮住的内容比它省下的力气多。
 */
export function shouldShowBackTop(scrollTop: number, viewportHeight: number, threshold?: number): boolean {
  return scrollTop > (typeof threshold === 'number' ? threshold : viewportHeight)
}

/**
 * 平滑滚回顶部时，每一帧该在哪。
 *
 * 自己算而不是直接用 scrollTo({ behavior: 'smooth' })：后者的时长由浏览器决定，
 * 长页面上会滚十几秒，用户以为卡住了。这里按固定时长走完，页面再长也一样快。
 * 缓动用三次方 ease-out——匀速滚动看起来像被拖拽，减速才像「到站」。
 */
export function backTopFrame(from: number, elapsed: number, duration = 320): number {
  if (elapsed >= duration) return 0
  const t = elapsed / duration
  const eased = 1 - Math.pow(1 - t, 3)
  return from * (1 - eased)
}
