/**
 * 评论线程、活动记录与未读定位的纯逻辑（astra.md 的 B14）。
 *
 * 一条工单下面的那一栏，同时装着两种东西：人说的话，和系统记的账
 * （「林岚把负责人改成了沈黎」）。它们必须按时间穿插在一起——分成两个标签页的话，
 * 读者永远拼不出「当时到底发生了什么」：一句「那就这么办」单独看没有意义，
 * 它上面那条「金额从 12 万改成 8 万」才是它在回应的东西。
 *
 * 四条规矩是这一层的全部内容：
 *
 * **一、删掉的父评论要留一个坑，不能整条抽走。**
 * 抽走之后，底下那几条回复就挂在空气里：「同意」「那按这个来」——同意什么？
 * 所以有回复的评论删掉后留一条「该评论已删除」占着位置；没有回复的才真的消失。
 *
 * **二、未读分隔线在打开的那一刻钉死，之后不许动。**
 * 新评论一直在进来，如果分隔线跟着往下跑，用户正读到一半，那条线就从他上方
 * 溜到了下方——他再也找不到自己读到哪儿了。进来的新评论排在下面，
 * 分隔线留在原地。
 *
 * **三、自己说的话不算未读。**
 * 否则刚发完一条就有一个未读角标，那个数字永远回不到零。
 *
 * **四、发失败的评论留在原地，带着原文。**
 * 悄悄丢掉是最糟的：用户写了三百字，切走再回来什么都没有，而他以为发出去了。
 */

export type ThreadEntryKind = 'comment' | 'activity'

export interface ThreadComment {
  id: string
  kind: 'comment'
  authorId: string
  authorName: string
  body: string
  createdAt: number
  /** 回复谁。顶层评论没有 */
  parentId?: string
  /** 编辑过的话，最后一次编辑的时刻 */
  editedAt?: number
  /** 已被删除。正文不再可信，界面上只留一个坑 */
  deleted?: boolean
  /** @ 到的人 */
  mentions?: readonly string[]
  /** 发送状态。没有表示已经在服务端落下了 */
  sendState?: 'sending' | 'failed'
  /** 发失败时的原因，给用户看的那句话 */
  sendError?: string
}

export interface ThreadActivity {
  id: string
  kind: 'activity'
  actorId: string
  actorName: string
  /** 改了什么。「负责人：林岚 → 沈黎」 */
  change: string
  createdAt: number
}

export type ThreadEntry = ThreadComment | ThreadActivity

export interface ThreadNode {
  comment: ThreadComment
  replies: ThreadNode[]
  /**
   * 这是一个被删掉但**留着位置**的评论：底下还有回复，抽走就会让它们挂在空气里。
   * 界面上显示「该评论已删除」而不是正文。
   */
  tombstone: boolean
}

export type ThreadItem =
  | { kind: 'comment'; node: ThreadNode }
  /** 连续的活动记录折起来的一组 */
  | { kind: 'activity'; activities: ThreadActivity[]; summary: string }

/** 删掉的评论显示什么 */
export const DELETED_BODY = '该评论已删除'

/**
 * 把一串平铺的条目组织成「按时间穿插、回复挂在父评论下面」的结构。
 *
 * 删掉的评论：**有回复就留坑**（`tombstone`），没有回复才真的消失——
 * 抽走一条有回复的父评论，底下那几句「同意」就没人知道在同意什么。
 *
 * 连续的活动记录折成一组：一次表单保存可能产生五六条变更记录，
 * 逐条铺开的话，人说的话会被系统记的账淹掉。
 */
export function threadItems(entries: readonly ThreadEntry[]): ThreadItem[] {
  const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt)
  const comments = sorted.filter((e): e is ThreadComment => e.kind === 'comment')

  const childrenOf = new Map<string, ThreadComment[]>()
  for (const comment of comments) {
    if (!comment.parentId) continue
    const list = childrenOf.get(comment.parentId) ?? []
    list.push(comment)
    childrenOf.set(comment.parentId, list)
  }

  const build = (comment: ThreadComment): ThreadNode | null => {
    const replies = (childrenOf.get(comment.id) ?? [])
      .map(build)
      .filter((node): node is ThreadNode => node !== null)
    // 没有回复的删除评论真的消失；有回复的留个坑，否则回复挂在空气里
    if (comment.deleted && replies.length === 0) return null
    return { comment, replies, tombstone: !!comment.deleted }
  }

  const items: ThreadItem[] = []
  let bucket: ThreadActivity[] = []
  const flush = () => {
    if (!bucket.length) return
    items.push({ kind: 'activity', activities: bucket, summary: activitySummary(bucket) })
    bucket = []
  }

  for (const entry of sorted) {
    if (entry.kind === 'activity') {
      bucket.push(entry)
      continue
    }
    if (entry.parentId) continue
    const node = build(entry)
    if (!node) continue
    flush()
    items.push({ kind: 'comment', node })
  }
  flush()
  return items
}

/**
 * 一组活动记录折起来之后那句话。
 *
 * 同一个人连着改的，说「林岚 修改了 3 项」；几个人一起改的不合并人名，
 * 说「3 条变更」——把三个人的改动说成一个人做的，是在记错账。
 */
export function activitySummary(activities: readonly ThreadActivity[]): string {
  if (activities.length === 1) return `${activities[0].actorName} ${activities[0].change}`
  const actors = new Set(activities.map((a) => a.actorId))
  return actors.size === 1
    ? `${activities[0].actorName} 修改了 ${activities.length} 项`
    : `${activities.length} 条变更`
}

/** 编辑痕迹。编辑过就要看得见，否则一句话被改了意思，读者毫无察觉 */
export function editNote(comment: ThreadComment, formatTime: (ms: number) => string): string {
  if (comment.deleted || comment.editedAt === undefined) return ''
  return `已编辑 · ${formatTime(comment.editedAt)}`
}

/* ---------- 未读 ---------- */

export interface UnreadState {
  /** 未读条数。**不含自己发的** */
  count: number
  /** 未读分隔线钉在哪条之前。没有未读时是 null */
  dividerId: string | null
  /** 摆给用户看的那句话 */
  text: string
}

/**
 * 打开这一栏的那一刻算一次未读，**之后不要再算**。
 *
 * 新评论一直在进来，如果分隔线跟着往下跑，用户正读到一半，那条线就从他上方
 * 溜到了下方——他再也找不到自己读到哪儿了。所以这个函数只在打开时调用一次，
 * 之后进来的评论排在下面，分隔线留在原地（见 `keepDivider`）。
 *
 * 自己发的不算未读：否则刚发完一条就有一个未读角标，那个数字永远回不到零。
 */
export function unreadState(
  entries: readonly ThreadEntry[],
  lastReadAt: number,
  meId: string
): UnreadState {
  const unread = [...entries]
    .filter((entry) => entry.createdAt > lastReadAt)
    .filter((entry) => (entry.kind === 'comment' ? entry.authorId : entry.actorId) !== meId)
    .sort((a, b) => a.createdAt - b.createdAt)
  if (!unread.length) return { count: 0, dividerId: null, text: '没有新消息' }
  return {
    count: unread.length,
    dividerId: unread[0].id,
    text: `${unread.length} 条新消息，从这里继续`
  }
}

/**
 * 有新条目进来之后的未读态。
 *
 * **分隔线不动**：它指向的那一条还在，就原样返回。计数照常增长——
 * 「又来了两条」是该知道的，「你读到哪儿了」则不该被改写。
 * 只有分隔线指向的那条被删干净了，才重新算一次。
 */
export function keepDivider(
  current: UnreadState,
  entries: readonly ThreadEntry[],
  lastReadAt: number,
  meId: string
): UnreadState {
  const next = unreadState(entries, lastReadAt, meId)
  if (current.dividerId === null) return next
  const alive = entries.some((entry) => entry.id === current.dividerId)
  if (!alive) return next
  return { ...next, dividerId: current.dividerId }
}

/**
 * 标记读到哪儿了。
 *
 * 取的是**这一栏里最后一条的时间**，不是当前时刻：拿当前时刻会把用户还没滚到的
 * 那几条也一并标成已读——它们的时间戳比「现在」早，但人根本没看见。
 */
export function readUpTo(entries: readonly ThreadEntry[], lastReadAt: number): number {
  return entries.reduce((max, entry) => Math.max(max, entry.createdAt), lastReadAt)
}

/* ---------- @ ---------- */

export interface MentionCheck {
  /** @ 到但不在这个话题里的人 */
  outsiders: string[]
  /** 说给用户听的那句话。没人在外面时是空串 */
  warning: string
}

/**
 * @ 到了话题外的人怎么办。
 *
 * **不拦，但要说**：@ 一个看不到这个话题的人，他收不到，而发的人以为他收到了，
 * 于是等一个永远不会来的回复。拦住不让发同样不对——把人拉进来正是 @ 的用途之一。
 */
export function checkMentions(
  mentions: readonly string[],
  participants: readonly string[],
  nameOf: (id: string) => string
): MentionCheck {
  const inside = new Set(participants)
  const outsiders = [...new Set(mentions)].filter((id) => !inside.has(id))
  return {
    outsiders,
    warning: outsiders.length
      ? `${outsiders.map(nameOf).join('、')}还不在这个话题里，发出后会把 TA 加进来`
      : ''
  }
}

/* ---------- 发送失败 ---------- */

export interface FailedComment {
  comment: ThreadComment
  /** 原文还在。用户写的三百字不能因为一次超时就没了 */
  body: string
  reason: string
}

/**
 * 发失败的那些。
 *
 * 留在原地、带着原文、说明原因——悄悄丢掉是最糟的：用户切走再回来什么都没有，
 * 而他以为发出去了。
 */
export function failedComments(entries: readonly ThreadEntry[]): FailedComment[] {
  return entries
    .filter((entry): entry is ThreadComment => entry.kind === 'comment')
    .filter((comment) => comment.sendState === 'failed')
    .map((comment) => ({
      comment,
      body: comment.body,
      reason: comment.sendError?.trim() || '网络没连上'
    }))
}

/** 重发：把失败的那条重新排回「发送中」，**不新建一条**，否则会发出两条一样的 */
export function retryComment(
  entries: readonly ThreadEntry[],
  id: string
): ThreadEntry[] {
  return entries.map((entry) =>
    entry.kind === 'comment' && entry.id === id && entry.sendState === 'failed'
      ? { ...entry, sendState: 'sending' as const, sendError: undefined }
      : entry
  )
}

/** 放弃：这一条彻底拿掉。只有用户明确说了不要，才允许丢掉他写的字 */
export function discardComment(entries: readonly ThreadEntry[], id: string): ThreadEntry[] {
  return entries.filter((entry) => entry.id !== id)
}
