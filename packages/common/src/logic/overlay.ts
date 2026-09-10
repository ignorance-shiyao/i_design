/**
 * 浮层定位：Tooltip / Popconfirm / Popover / Dropdown / Select 共用的同一份规则。
 *
 * 定位这件事一旦让每个组件自己算，就会出现四份互相不一致的实现——更糟的是，
 * 其中三份会忘记做视口避让：贴着屏幕右缘的下拉菜单被裁掉一半，
 * 而这在任何单元测试和构建里都看不出来。
 *
 * 这里只做纯计算：输入几个矩形，输出最终落点。不碰 DOM，因此小程序
 * （用 boundingClientRect 查询）与 Flutter（用 RenderBox）能复用同一套判断。
 */

export type Placement = 'top' | 'bottom' | 'left' | 'right'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface OverlayOptions {
  /** 触发元素相对视口的位置 */
  trigger: Rect
  /** 浮层自身尺寸（只用 width / height） */
  popup: Rect
  /** 可用区域，通常是视口 */
  viewport: Rect
  placement?: Placement
  /** 浮层与触发元素之间的间距 */
  offset?: number
  /** 与可用区边缘至少保留的距离 */
  padding?: number
  /**
   * 主轴对齐方式。
   * center 让浮层以触发元素为中心，适合气泡与提示；
   * start 让浮层的起始边与触发元素对齐，适合下拉菜单与选择器——
   * 面板通常比触发器宽得多，居中会让它向左溢出、压住旁边的内容。
   */
  align?: 'center' | 'start'
  /**
   * 是否允许翻转到对侧。
   * 关掉它用于「方向本身有语义」的场景，比如级联菜单必须始终向右展开。
   */
  flip?: boolean
}

export interface OverlayPosition {
  x: number
  y: number
  /** 实际采用的方向，可能因翻转而与传入的不同；箭头要按它来画 */
  placement: Placement
  /**
   * 箭头相对浮层左上角的位置。
   * 浮层被推回视口内之后，箭头必须留在触发元素中心的正上/下方，
   * 否则会出现「气泡指着旁边一个按钮」这种更难察觉的错误。
   */
  arrow: number
}

const OPPOSITE: Record<Placement, Placement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
}

const isVertical = (p: Placement) => p === 'top' || p === 'bottom'

/** 某个方向上放不放得下 */
function fits(placement: Placement, o: Required<Pick<OverlayOptions, 'trigger' | 'popup' | 'viewport' | 'offset' | 'padding'>>) {
  const { trigger, popup, viewport, offset, padding } = o
  switch (placement) {
    case 'top':
      return trigger.y - popup.height - offset >= viewport.y + padding
    case 'bottom':
      return trigger.y + trigger.height + popup.height + offset <= viewport.y + viewport.height - padding
    case 'left':
      return trigger.x - popup.width - offset >= viewport.x + padding
    case 'right':
      return trigger.x + trigger.width + popup.width + offset <= viewport.x + viewport.width - padding
  }
}

/** 把值夹在区间内；区间本身不够宽时贴住起点，避免出现负数宽度的诡异结果 */
const clamp = (value: number, min: number, max: number) =>
  max < min ? min : Math.min(Math.max(value, min), max)

/**
 * 计算浮层最终落点。
 *
 * 两步：先定方向（放不下就翻到对侧，对侧同样放不下则保持原方向——
 * 两边都放不下时翻转没有意义，不如维持调用方声明的语义），
 * 再沿另一轴把浮层推回可用区内。
 */
export function resolveOverlay(options: OverlayOptions): OverlayPosition {
  const {
    trigger,
    popup,
    viewport,
    placement = 'top',
    offset = 8,
    padding = 8,
    flip = true,
    align = 'center'
  } = options
  const base = { trigger, popup, viewport, offset, padding }

  let final = placement
  if (flip && !fits(placement, base) && fits(OPPOSITE[placement], base)) {
    final = OPPOSITE[placement]
  }

  let x: number
  let y: number
  if (isVertical(final)) {
    y = final === 'top' ? trigger.y - popup.height - offset : trigger.y + trigger.height + offset
    // 先按对齐方式定位，再夹回视口
    x = clamp(
      align === 'start' ? trigger.x : trigger.x + trigger.width / 2 - popup.width / 2,
      viewport.x + padding,
      viewport.x + viewport.width - popup.width - padding
    )
  } else {
    x = final === 'left' ? trigger.x - popup.width - offset : trigger.x + trigger.width + offset
    y = clamp(
      align === 'start' ? trigger.y : trigger.y + trigger.height / 2 - popup.height / 2,
      viewport.y + padding,
      viewport.y + viewport.height - popup.height - padding
    )
  }

  // 箭头跟着触发元素中心走，而不是跟着浮层中心
  const center = isVertical(final)
    ? trigger.x + trigger.width / 2 - x
    : trigger.y + trigger.height / 2 - y
  const span = isVertical(final) ? popup.width : popup.height
  const arrow = clamp(center, 12, Math.max(12, span - 12))

  return { x, y, placement: final, arrow }
}

/**
 * 菜单项的键盘移动，跳过禁用项与分隔线。
 * 到边界后回绕：菜单与 Select 不同，它是一个封闭的短列表，回绕比停住更符合预期。
 */
export interface MenuItemLike {
  disabled?: boolean
  /** 分隔线不可聚焦 */
  divider?: boolean
}

export function moveMenuActive<T extends MenuItemLike>(items: T[], current: number, step: 1 | -1): number {
  const count = items.length
  if (!count) return -1
  let next = current
  for (let i = 0; i < count; i++) {
    next = (next + step + count) % count
    const item = items[next]
    if (!item.disabled && !item.divider) return next
  }
  return current
}

/** 首个可聚焦项，用于菜单打开时把高亮落在合理位置 */
export function firstMenuActive<T extends MenuItemLike>(items: T[]): number {
  return items.findIndex((item) => !item.disabled && !item.divider)
}

/* ---------- 新手引导 ---------- */

export interface TourStep {
  /** 要高亮的元素，各端自行解析（Web 是 CSS 选择器） */
  target: string
  title: string
  description: string
  placement?: Placement
}

export interface TourHole {
  x: number
  y: number
  width: number
  height: number
  radius: number
}

/**
 * 高亮框：目标元素向外扩一圈。
 *
 * 不贴着元素边缘挖：贴边挖出来的洞看起来像元素被裁掉了一块，
 * 而且元素自身的外阴影、focus 环会落在洞外的暗区里，显得断开。
 * 扩出来的这一圈同时给了「这是被指出来的那个」的余量。
 */
export function tourHole(
  rect: { x: number; y: number; width: number; height: number },
  { padding = 6, radius = 8 } = {}
): TourHole {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    radius
  }
}

/**
 * 下一步的下标。到末步返回 -1，表示引导结束。
 *
 * 结束用 -1 而不是停在末步：停在末步时，「下一步」按钮点下去没有任何变化，
 * 用户不知道是走完了还是卡住了——调用方拿到 -1 才知道该关掉浮层。
 */
export function tourNext(current: number, total: number): number {
  if (current + 1 >= total) return -1
  return current + 1
}

/** 上一步。首步不再后退，返回 0 */
export function tourPrev(current: number): number {
  return Math.max(0, current - 1)
}

/**
 * 目标不在视口里时，要把它滚到哪个位置。
 *
 * 滚到正中而不是滚到刚好露出来：刚好露出来时，说明气泡多半就没地方放了，
 * 会被挤到目标另一侧，读者得先找一遍气泡在哪。
 */
export function tourScrollTo(
  rect: { y: number; height: number },
  viewport: { height: number },
  scrollTop: number
): number {
  const center = rect.y + scrollTop + rect.height / 2
  return Math.max(0, center - viewport.height / 2)
}

/**
 * 目标此刻是否已经完整可见。可见就不滚，省掉一次没必要的跳动。
 */
export function tourNeedsScroll(
  rect: { y: number; height: number },
  viewport: { height: number },
  padding = 24
): boolean {
  return rect.y < padding || rect.y + rect.height > viewport.height - padding
}
