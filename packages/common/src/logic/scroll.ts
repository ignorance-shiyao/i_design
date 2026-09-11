/**
 * 无限滚动的触发规则。
 *
 * 「什么时候该加载下一页」是个很容易各端各写一遍的判断，而写错的后果都不会报错：
 * 要么同一页连发三次请求，要么翻到底了再也不动。
 */

export type LoadStatus = 'idle' | 'loading' | 'finished' | 'error'

export interface ScrollMetrics {
  scrollTop: number
  clientHeight: number
  scrollHeight: number
}

/** 距底多少像素开始加载。提前一屏的三分之一，用户基本感觉不到等待 */
export const LOAD_THRESHOLD = 120

/**
 * 状态闸门：loading / finished / error 时一律不许再发请求。
 *
 * 单独抽出来是因为有些端自带「滚到底」事件（小程序的 scrolltolower），
 * 那时距底判定已经由平台做了，需要的只是这道闸门——
 * 而如果在那条路径上顺手省掉它，同一页会连发几十个请求。
 */
export function canLoad(status: LoadStatus): boolean {
  return status === 'idle'
}

/**
 * 此刻该不该去加载下一页。
 *
 * 三条规则：
 *
 * 1. loading / finished / error 时一律不触发。少了这一条，滚动事件每帧一次，
 *    同一页会连发几十个请求——而它在本地开发时几乎看不出来，接口够快，
 *    重复的响应互相覆盖，页面看着是对的。
 * 2. 内容还没撑满容器时直接触发。第一页太短就没有滚动条，
 *    用户再怎么划也到不了底，列表会永远停在第一页——
 *    这是无限滚动最常见的、且只在「窗口很高」或「第一页很少」时才暴露的死局。
 * 3. 否则看距底距离。
 */
export function shouldLoadMore(
  metrics: ScrollMetrics,
  status: LoadStatus,
  threshold = LOAD_THRESHOLD
): boolean {
  if (!canLoad(status)) return false
  // 内容没撑满容器：没有滚动条，用户永远划不到底
  if (metrics.scrollHeight <= metrics.clientHeight) return true
  const distance = metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight
  return distance <= threshold
}

/** 底部该显示哪句话。文案与状态绑死，各端不会一个写「加载中」一个写「努力加载」 */
export function loadHint(status: LoadStatus, empty = false): string {
  if (status === 'loading') return '加载中…'
  if (status === 'error') return '加载失败，点击重试'
  if (status === 'finished') return empty ? '暂无内容' : '没有更多了'
  return ''
}

/**
 * 加载失败后该退到哪个状态。
 *
 * 退回 idle 而不是停在 error：停在 error 时，用户点了重试、请求又失败，
 * 界面没有任何变化，看起来像按钮坏了。经过一次 loading 才能让人看出「试过了」。
 */
export function retryStatus(): LoadStatus {
  return 'loading'
}

/* ------------------------------------------------------ 自绘滚动条 */

export interface ScrollThumb {
  /** 滑块长度（像素） */
  size: number
  /** 滑块距轨道起点的偏移（像素） */
  offset: number
  /** 内容装得下时不需要滚动条 */
  visible: boolean
}

/** 滑块的最小长度。再短就抓不住了，而内容越长滑块越短，不设下限会缩成一个点 */
export const SCROLL_THUMB_MIN = 24

/**
 * 由滚动状态算出滑块的长度与位置。
 *
 * 长度按「可视区占内容」的比例，位置按「已滚动占可滚动」的比例——
 * 注意这两个分母不同：位置的分母要扣掉滑块自身长度，
 * 用同一个分母的话，滚到底时滑块会露出轨道外一截。
 */
export function scrollThumb(
  metrics: ScrollMetrics,
  trackLength: number,
  minSize = SCROLL_THUMB_MIN
): ScrollThumb {
  const { scrollTop, clientHeight, scrollHeight } = metrics
  if (scrollHeight <= clientHeight || trackLength <= 0) {
    return { size: 0, offset: 0, visible: false }
  }

  const ratio = clientHeight / scrollHeight
  const size = Math.max(minSize, Math.round(trackLength * ratio))
  const maxScroll = scrollHeight - clientHeight
  const progress = maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / maxScroll))
  return { size, offset: Math.round((trackLength - size) * progress), visible: true }
}

/**
 * 拖动滑块时，滑块偏移反推内容该滚到哪。
 * 与 scrollThumb 互为逆运算，因此分母同样要扣掉滑块长度。
 */
export function scrollTopOfThumb(
  offset: number,
  thumbSize: number,
  trackLength: number,
  metrics: ScrollMetrics
): number {
  const room = trackLength - thumbSize
  if (room <= 0) return 0
  const progress = Math.min(1, Math.max(0, offset / room))
  return Math.round((metrics.scrollHeight - metrics.clientHeight) * progress)
}
