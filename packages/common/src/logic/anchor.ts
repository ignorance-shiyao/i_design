/**
 * 页内锚点的「当前章节」判定。
 *
 * 看似只要「找到第一个还没滚过去的标题」，但有两个坑单靠直觉写必踩：
 *   1. 滚到页面底部时，最后几个短章节永远高亮不到——它们的顶部已经在视口上方，
 *      但页面已经滚不动了。必须在触底时直接选中最后一个。
 *   2. 判定线不能用视口顶端 0：那样标题刚滚出视野才切换，读者已经在读下一节了。
 *      用一个偏移量（默认 80px，约等于吸顶导航的高度）作为判定线。
 */

export interface AnchorTarget {
  key: string
  /** 该章节顶端相对文档的位置 */
  top: number
}

export interface ActiveAnchorOptions {
  /** 当前滚动位置 */
  scrollTop: number
  /** 视口高度 */
  viewportHeight: number
  /** 文档总高度 */
  documentHeight: number
  /** 判定线相对视口顶端的偏移 */
  offset?: number
}

/**
 * 返回当前应当高亮的锚点 key；没有任何章节命中时返回空串。
 */
export function activeAnchor(targets: AnchorTarget[], options: ActiveAnchorOptions): string {
  if (!targets.length) return ''
  const { scrollTop, viewportHeight, documentHeight, offset = 80 } = options

  // 触底：最后一个章节可能比视口短，永远越不过判定线
  const atBottom = scrollTop + viewportHeight >= documentHeight - 2
  if (atBottom) return targets[targets.length - 1].key

  const line = scrollTop + offset
  let active = ''
  for (const target of targets) {
    if (target.top <= line) active = target.key
    else break
  }
  // 还没滚到第一个标题时高亮第一项，而不是留空——空着会让人以为锚点坏了
  return active || targets[0].key
}

/** 滚动到某个锚点时的目标位置，减去吸顶高度，避免标题被导航盖住 */
export function anchorScrollTop(top: number, offset = 80): number {
  return Math.max(0, top - offset)
}
