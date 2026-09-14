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

/**
 * 一条会话现在还能不能打开。
 *
 * 「打不开」有两种，必须分开说：没权限（别人分享给你但收回了）与已失效
 * （后端清理了、模型下线了）。都笼统显示成「加载失败」的话，
 * 用户会一直重试一条永远打不开的会话。
 */
export type ChatAccess = 'ok' | 'forbidden' | 'expired'

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
  /** 已归档：默认不出现在列表里，但不是删除 */
  archived?: boolean
  /** 能不能打开；不传视为 ok */
  access?: ChatAccess
  /** 打不开的原因，直接显示给用户看 */
  accessReason?: string
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


/* ───────────────────────── 会话管理 ───────────────────────── */

/** 打不开时显示什么。原因由后端给，给不出时也要有一句能读的话 */
export function accessReasonOf(session: ChatSession): string {
  if (!session.access || session.access === 'ok') return ''
  if (session.accessReason?.trim()) return session.accessReason.trim()
  return session.access === 'forbidden' ? '没有这条会话的权限' : '这条会话已失效'
}

export const canOpenSession = (session: ChatSession): boolean =>
  !session.access || session.access === 'ok'

/**
 * 重命名。
 *
 * 空标题不是错误：它表示「交还给自动标题」，所以清空之后显示的是摘要或
 * 「新会话」，而不是一条没有名字的空行。首尾空白一律去掉——
 * 粘贴进来的标题常带着换行，留着会让列表行高忽高忽低。
 */
export function renameSession(sessions: ChatSession[], id: string, title: string): ChatSession[] {
  const next = title.replace(/\s+/g, ' ').trim().slice(0, 60)
  return sessions.map((s) => (s.id === id ? { ...s, title: next || undefined } : s))
}

/** 归档 / 取消归档。归档不改 updatedAt——它不是一次「活动」，不该把会话顶到最前 */
export function setArchived(sessions: ChatSession[], id: string, archived: boolean): ChatSession[] {
  return sessions.map((s) => (s.id === id ? { ...s, archived } : s))
}

/** 列表视图：默认只看未归档的，归档视图只看归档的。两边都不含彼此 */
export function visibleSessions(sessions: ChatSession[], view: 'active' | 'archived' = 'active'): ChatSession[] {
  return sessions.filter((s) => (view === 'archived' ? !!s.archived : !s.archived))
}

export interface RemovedSession {
  session: ChatSession
  /** 原来在数组里的位置。撤销时放回原处，而不是追加到末尾 */
  index: number
}

/**
 * 删除（可撤销）。
 *
 * 返回被删的那条与它的位置：撤销时放回原处。追加到末尾的话，
 * 用户撤销之后会发现会话「跑到别的地方去了」，还以为撤销没成功。
 */
export function removeSession(sessions: ChatSession[], id: string): {
  sessions: ChatSession[]
  removed: RemovedSession | null
} {
  const index = sessions.findIndex((s) => s.id === id)
  if (index < 0) return { sessions, removed: null }
  const next = [...sessions]
  const [session] = next.splice(index, 1)
  return { sessions: next, removed: { session, index } }
}

export function undoRemove(sessions: ChatSession[], removed: RemovedSession): ChatSession[] {
  const next = [...sessions]
  next.splice(Math.min(removed.index, next.length), 0, removed.session)
  return next
}

/**
 * 分页。
 *
 * 长列表不跳动的关键不在分页本身，在**排序要稳定**：两条 updatedAt 相同的
 * 会话，如果每次比较的结果不一样，翻页时它们会来回换位，看起来像列表在抖。
 * 所以时间相同时按 id 兜底。
 */
export function pageSessions(
  sessions: ChatSession[],
  page: number,
  pageSize: number
): { items: ChatSession[]; page: number; pageCount: number; total: number } {
  const sorted = [...sessions].sort(
    (a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id)
  )
  const size = Math.max(1, pageSize)
  const pageCount = Math.max(1, Math.ceil(sorted.length / size))
  const current = Math.min(Math.max(1, page), pageCount)
  return {
    items: sorted.slice((current - 1) * size, current * size),
    page: current,
    pageCount,
    total: sorted.length
  }
}
