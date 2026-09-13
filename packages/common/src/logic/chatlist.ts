/**
 * 会话列表的纯逻辑。
 *
 * 多轮会话攒到几十条之后，列表本身就成了一个要解决的问题。三件事最容易出错，
 * 因此都放在这里：
 *
 * - **分组按时间，而不是一条长列表**。「今天」「昨天」「最近 7 天」「更早」
 *   四档就够——再细分，读者得先读组标题才知道自己在看哪一段。
 * - **标题为空时显示什么**。智能体还没来得及给会话起名时标题是空的，
 *   此时显示一片空白，用户会以为这条会话坏了。
 * - **删掉当前这条之后选谁**。跳回第一条是最省事的写法，也是最坏的：
 *   用户正在看的是列表中段，删一条就被弹回顶部，他得重新找位置。
 */
import { isSameDay } from './date'

export interface ChatSession {
  id: string
  /** 会话标题。智能体还没起名时是空的 */
  title?: string
  /** 最后一条消息的摘要，标题为空时顶上 */
  preview?: string
  /** 最后活动时间（毫秒） */
  updatedAt: number
  /** 置顶的会话单独成组，排在时间分组之前 */
  pinned?: boolean
}

/**
 * 会话在列表里显示的标题。
 *
 * 标题为空时用摘要顶上，摘要也没有才退到「新会话」——直接显示空白的话，
 * 用户会以为这条会话坏了。摘要截断到一行能放下的长度。
 */
export function sessionTitle(session: ChatSession, max = 28): string {
  const title = session.title?.trim()
  if (title) return title
  const preview = session.preview?.replace(/\s+/g, ' ').trim()
  if (!preview) return '新会话'
  return preview.length <= max ? preview : `${preview.slice(0, max - 1)}…`
}

export type ChatGroupKey = 'pinned' | 'today' | 'yesterday' | 'week' | 'earlier'

export interface ChatGroup {
  key: ChatGroupKey
  label: string
  sessions: ChatSession[]
}

const GROUP_LABELS: Record<ChatGroupKey, string> = {
  pinned: '置顶',
  today: '今天',
  yesterday: '昨天',
  week: '最近 7 天',
  earlier: '更早'
}

/** 一条会话属于哪一组。置顶优先于时间——置顶的意思就是「别让它沉下去」 */
export function groupKeyOf(session: ChatSession, now: number): ChatGroupKey {
  if (session.pinned) return 'pinned'
  const today = new Date(now)
  const at = new Date(session.updatedAt)
  if (isSameDay(today, at)) return 'today'
  const yesterday = new Date(now - 24 * 3600 * 1000)
  if (isSameDay(yesterday, at)) return 'yesterday'
  // 按天数而不是按 7×24 小时：昨晚 23 点的会话今早不该因为差了几小时就掉进「更早」
  const days = Math.floor((startOfDay(now) - startOfDay(session.updatedAt)) / (24 * 3600 * 1000))
  return days <= 7 ? 'week' : 'earlier'
}

function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * 分组后的会话。
 *
 * 组内按最后活动时间倒序；空组不返回——「今天」底下一条也没有的话，
 * 那行组标题只是在占地方。
 */
export function groupSessions(sessions: ChatSession[], now: number): ChatGroup[] {
  const order: ChatGroupKey[] = ['pinned', 'today', 'yesterday', 'week', 'earlier']
  const buckets = new Map<ChatGroupKey, ChatSession[]>()
  for (const session of sessions) {
    const key = groupKeyOf(session, now)
    const list = buckets.get(key)
    if (list) list.push(session)
    else buckets.set(key, [session])
  }
  return order
    .filter((key) => buckets.get(key)?.length)
    .map((key) => ({
      key,
      label: GROUP_LABELS[key],
      sessions: [...buckets.get(key)!].sort((a, b) => b.updatedAt - a.updatedAt)
    }))
}

/**
 * 按关键词过滤。
 *
 * 标题与摘要都要搜：用户记得的往往是自己说过的那句话，而不是智能体起的标题。
 * 大小写不敏感，空白关键词返回全部而不是空列表。
 */
export function filterSessions(sessions: ChatSession[], query: string): ChatSession[] {
  const q = query.trim().toLowerCase()
  if (!q) return sessions
  return sessions.filter((s) =>
    `${s.title ?? ''} ${s.preview ?? ''}`.toLowerCase().includes(q)
  )
}

/**
 * 删掉一条之后该选谁。
 *
 * 删的不是当前这条时，当前选中不变——列表动了不等于用户想换一条看。
 * 删的就是当前这条时选它的**后一条**，没有后一条才退到前一条：
 * 跳回第一条是最省事的写法，也是最坏的——用户正在看列表中段，
 * 删一条就被弹回顶部，他得重新找位置。
 *
 * 「后一条」按**分组压平之后的顺序**算，不按传入数组的顺序。这两者几乎从不
 * 一致：置顶的会话在显示时被提到最前，而在原数组里还待在原位。按原数组算的话，
 * 删掉列表中段那一条，选中会跳到一个看起来毫不相干的位置上——实测过一次，
 * 删「季度数据核对」跳到了顶部的「常用提示词」。
 */
export function nextAfterDelete(
  groups: ChatGroup[],
  deletedId: string,
  activeId: string
): string {
  if (deletedId !== activeId) return activeId
  const flat = groups.flatMap((g) => g.sessions)
  const index = flat.findIndex((s) => s.id === deletedId)
  if (index < 0) return activeId
  const rest = flat.filter((s) => s.id !== deletedId)
  if (!rest.length) return ''
  return (rest[index] ?? rest[rest.length - 1]).id
}

/**
 * 键盘上下移动落到哪一条。
 *
 * 走的是**分组压平之后的顺序**，而不是原数组顺序：用户看到的是分好组的列表，
 * 按一下向下键却跳到别的组里去，那是两套顺序在打架。到头停住，不绕回。
 */
export function moveActiveSession(groups: ChatGroup[], activeId: string, step: 1 | -1): string {
  const flat = groups.flatMap((g) => g.sessions)
  if (!flat.length) return activeId
  const index = flat.findIndex((s) => s.id === activeId)
  if (index < 0) return flat[0].id
  const next = Math.min(flat.length - 1, Math.max(0, index + step))
  return flat[next].id
}
