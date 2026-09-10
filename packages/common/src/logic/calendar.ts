/**
 * 日历视图的标记与选择。
 *
 * 格子本身由 logic/date 的 buildCalendar 生成，这里只加「这一天上有什么」
 * 与「点了之后选中范围变成什么」——后者是最容易各端分叉的一处：
 * 点第二下到底是「结束日期」还是「重新开始选」，两种都说得通。
 */

import { toISO } from './date'

export interface CalendarMark {
  /** ISO 日期，YYYY-MM-DD */
  date: string
  /** 一句话说明，显示在格子里 */
  label?: string
  /** 语义色：与状态色对齐，而不是自选颜色 */
  type?: 'brand' | 'success' | 'warning' | 'danger'
}

export interface DateRange {
  start: string | null
  end: string | null
}

/** 把标记按日期归拢，渲染时一次查表，不必每格都遍历一遍 */
export function groupMarks(marks: CalendarMark[]): Map<string, CalendarMark[]> {
  const map = new Map<string, CalendarMark[]>()
  for (const mark of marks) {
    const list = map.get(mark.date)
    if (list) list.push(mark)
    else map.set(mark.date, [mark])
  }
  return map
}

/**
 * 点一天之后，选中范围变成什么。
 *
 * 已经选完一段再点，是「重新开始选」而不是「延长这一段」。
 * 延长的语义在只有点击、没有拖拽的界面里说不清——用户点第三下时，
 * 没有任何线索告诉他这一下会改起点还是改终点。
 *
 * 点到比起点更早的日期时，自动对调而不是拒绝：用户从右往左选是常事，
 * 拒绝的话他得先想明白「原来要从左边开始点」，而这条规则界面上没写。
 */
export function selectRange(range: DateRange, iso: string): DateRange {
  if (!range.start || range.end) return { start: iso, end: null }
  return iso < range.start ? { start: iso, end: range.start } : { start: range.start, end: iso }
}

export function isInRange(iso: string, range: DateRange): boolean {
  if (!range.start || !range.end) return false
  return iso >= range.start && iso <= range.end
}

export function isRangeEdge(iso: string, range: DateRange): 'start' | 'end' | null {
  if (iso === range.start) return 'start'
  if (iso === range.end) return 'end'
  return null
}

/**
 * 键盘导航：方向键按天走，上下按周走。
 *
 * 日历必须能用键盘走完。只能点的话，用键盘操作的人要选一个三个月后的日期
 * 得先用 Tab 穿过前面所有格子——42 个格子，每换一个月再来一遍。
 */
export function moveFocus(iso: string, key: string): string | null {
  const deltas: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
    PageUp: -28,
    PageDown: 28
  }
  const delta = deltas[key]
  if (delta === undefined) return null
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + delta)
  return toISO(date)
}
