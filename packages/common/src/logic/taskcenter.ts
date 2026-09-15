/**
 * 异步任务中心的纯逻辑（astra.md 的 B18）。
 *
 * 系统里凡是「点一下之后不会马上完事」的动作——导出、导入、批量改、生成报表、
 * 对账——都会落到同一个地方去。这一层要立住的是三件事：
 *
 * **一、每条任务都追得到它改了什么。**
 * 「导入完成」这四个字本身毫无用处：完成的是哪一次导入、改的是哪张单、
 * 出问题了找谁。所以任务必须带上业务对象（`target`）与任务号（`id`），
 * 通知也照抄这两样。没有业务对象的任务，通知里给的是任务号与「查看任务详情」，
 * **绝不允许只报一句「完成了」**——那样用户唯一能做的就是去列表里一条条翻。
 *
 * **二、角标数的是「要人处理的」，不是任务总数。**
 * 把进行中的也算进角标，那个数字永远回不到零，几天之后所有人都不再看它。
 * 要人处理的只有两类：失败了的，和跑完了但还没人看过的。
 *
 * **三、同一件事正在跑，就不要再排一个。**
 * 导出点三次拿三份一样的文件，是这一条没做的直接后果。
 *
 * 排序也有一条容易忽略的：**已经结束的任务不要再动位置**。
 * 按「最近活动」排会让一条刚刚完成的任务把下面几条挤走，用户正要点的那条
 * 在他手指落下的瞬间换了人——所以进行中的在最上面（它们本来就会变），
 * 失败的紧随其后（要人处理），剩下的按结束时间倒序，一旦结束就不再移动。
 */

import { searchCommands, type CommandItem } from './command'

export type TaskState = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

/** 任务动到的业务对象。有它，通知才点得下去 */
export interface TaskTarget {
  /** 「订单」「客户」「报表」 */
  kind: string
  id: string
  /** 给人看的名字。「SO-2026-0912」 */
  label: string
}

export interface AsyncTaskItem {
  /** 任务号。出问题时用户报给客服的就是它，因此它必须出现在界面上 */
  id: string
  title: string
  state: TaskState
  /** 提交时刻（毫秒时间戳） */
  createdAt: number
  /** 结束时刻。没结束就没有 */
  finishedAt?: number
  /** 谁提交的 */
  actor?: string
  /** 动到的业务对象 */
  target?: TaskTarget
  /** 失败原因。给用户看的那句话，不是堆栈 */
  error?: string
  /** 结果摘要。「导出 48000 行」 */
  result?: string
  /** 同一件事的去重键。正在跑的同键任务不再排第二个 */
  dedupeKey?: string
  /** 用户看过结果了没有。只对已结束的任务有意义 */
  seen?: boolean
}

const ACTIVE: TaskState[] = ['queued', 'running']

export function isActive(task: AsyncTaskItem): boolean {
  return ACTIVE.includes(task.state)
}

/**
 * 任务中心的排序。
 *
 * 进行中在最上面（它们本来就会变），失败的紧随其后（要人处理），
 * 剩下的按结束时间倒序。**结束之后就不再移动**——按「最近活动」排的话，
 * 一条刚完成的任务会把下面几条挤走，用户正要点的那条在他手指落下时换了人。
 */
export function taskOrder(tasks: readonly AsyncTaskItem[]): AsyncTaskItem[] {
  const rank = (task: AsyncTaskItem) =>
    isActive(task) ? 0 : task.state === 'failed' ? 1 : 2
  return [...tasks].sort((a, b) => {
    const byRank = rank(a) - rank(b)
    if (byRank !== 0) return byRank
    // 同一档里：进行中按提交时间正序（先提交的先结束），已结束按结束时间倒序
    if (isActive(a) && isActive(b)) return a.createdAt - b.createdAt
    return (b.finishedAt ?? b.createdAt) - (a.finishedAt ?? a.createdAt)
  })
}

export interface TaskBadge {
  /** 要人处理的条数。角标显示它 */
  count: number
  /** 其中失败了几条 */
  failed: number
  /** 其中跑完还没人看过的几条 */
  unseen: number
  /** 正在跑的几条。它**不进角标**，只在展开后说 */
  running: number
  /** 给读屏与 title 用的一句话 */
  text: string
}

/**
 * 角标。
 *
 * 数的是「要人处理的」：失败了的，和跑完了但还没人看过的。
 * 进行中的不算——把它们算进去，那个数字永远回不到零，
 * 几天之后所有人都不再看这个角标。
 */
export function taskBadge(tasks: readonly AsyncTaskItem[]): TaskBadge {
  const failed = tasks.filter((t) => t.state === 'failed' && !t.seen).length
  const unseen = tasks.filter((t) => t.state === 'succeeded' && !t.seen).length
  const running = tasks.filter(isActive).length
  const count = failed + unseen
  const parts: string[] = []
  if (failed) parts.push(`${failed} 条失败`)
  if (unseen) parts.push(`${unseen} 条已完成待查看`)
  if (running) parts.push(`${running} 条进行中`)
  return {
    count,
    failed,
    unseen,
    running,
    text: parts.length ? `任务中心：${parts.join('，')}` : '任务中心：没有待处理的任务'
  }
}

export type TaskNoticeTone = 'neutral' | 'success' | 'danger'

export interface TaskNotice {
  taskId: string
  tone: TaskNoticeTone
  title: string
  description: string
  /** 点它去哪儿。没有业务对象时是「查看任务详情」，**永远不是没有出口** */
  actionLabel: string
  target: TaskTarget | null
}

/**
 * 一条任务变成一条通知。
 *
 * 通知必须**定位得到业务对象**：有 target 就直奔那张单，没有就至少给出任务号
 * 与「查看任务详情」。只报一句「完成了」的通知，用户唯一能做的是去列表里
 * 一条条翻——那等于没通知。
 *
 * 只有已结束的任务才发通知：进行中的每动一下就弹一条，用户会把整个通知区关掉，
 * 连失败那条一起关掉。
 */
export function taskNotice(task: AsyncTaskItem): TaskNotice | null {
  if (isActive(task)) return null
  const where = task.target ? `${task.target.kind}「${task.target.label}」` : `任务 ${task.id}`
  if (task.state === 'failed') {
    return {
      taskId: task.id,
      tone: 'danger',
      title: `${task.title}失败`,
      description: `${where}：${task.error?.trim() || '未知原因'}`,
      actionLabel: task.target ? `查看${task.target.kind}` : '查看任务详情',
      target: task.target ?? null
    }
  }
  if (task.state === 'cancelled') {
    return {
      taskId: task.id,
      tone: 'neutral',
      title: `${task.title}已取消`,
      description: `${where}没有发生变化`,
      actionLabel: task.target ? `查看${task.target.kind}` : '查看任务详情',
      target: task.target ?? null
    }
  }
  return {
    taskId: task.id,
    tone: 'success',
    title: `${task.title}完成`,
    description: task.result?.trim() ? `${where}：${task.result.trim()}` : where,
    actionLabel: task.target ? `查看${task.target.kind}` : '查看任务详情',
    target: task.target ?? null
  }
}

/**
 * 同一个任务只保留最新的一条通知。
 *
 * 一条任务从排队到失败会经过好几态，每态弹一条的话，通知区里会堆着同一件事的
 * 三四条记录，而最要紧的那条（失败）被挤到最下面。
 */
export function dedupeNotices(notices: readonly TaskNotice[]): TaskNotice[] {
  const latest = new Map<string, TaskNotice>()
  for (const notice of notices) latest.set(notice.taskId, notice)
  return [...latest.values()]
}

export interface SubmitResult {
  tasks: AsyncTaskItem[]
  /** 这次提交是不是被合并到了一个正在跑的任务上 */
  merged: boolean
  /** 合并到了哪一条 / 新建的是哪一条 */
  taskId: string
  /** 说给用户听的那句话。合并时必须说清「它已经在跑了」 */
  message: string
}

/**
 * 提交一个任务。
 *
 * 同 `dedupeKey` 的任务**正在跑**时不再排第二个，而是把这次提交合并过去，
 * 并明说「它已经在跑了」——导出点三次拿三份一样的文件，就是这一条没做。
 * 已经结束的同键任务不拦：用户改完数据再导一次是正当需求。
 */
export function submitTask(
  tasks: readonly AsyncTaskItem[],
  incoming: AsyncTaskItem
): SubmitResult {
  const running = incoming.dedupeKey
    ? tasks.find((t) => t.dedupeKey === incoming.dedupeKey && isActive(t))
    : undefined
  if (running) {
    return {
      tasks: [...tasks],
      merged: true,
      taskId: running.id,
      message: `「${running.title}」已经在跑了，完成后会通知你（任务号 ${running.id}）`
    }
  }
  return {
    tasks: [incoming, ...tasks],
    merged: false,
    taskId: incoming.id,
    message: `已提交，完成后会通知你（任务号 ${incoming.id}）`
  }
}

/** 看过了。只有已结束的任务谈得上「看过」 */
export function markSeen(tasks: readonly AsyncTaskItem[], id: string): AsyncTaskItem[] {
  return tasks.map((task) =>
    task.id === id && !isActive(task) ? { ...task, seen: true } : task
  )
}

/** 全部标为看过。失败的那些**也算看过**——「看过」不等于「处理完了」 */
export function markAllSeen(tasks: readonly AsyncTaskItem[]): AsyncTaskItem[] {
  return tasks.map((task) => (isActive(task) ? task : { ...task, seen: true }))
}

/**
 * 任务的追踪行。
 *
 * 任务号排在第一位：用户打电话给客服时，能报出来的只有它。
 * 提交人与提交时间紧随其后——一条谁也不认领的任务，排查时第一步就卡住。
 */
export function taskTrail(task: AsyncTaskItem, formatTime: (ms: number) => string): string[] {
  const lines = [`任务号：${task.id}`, `提交时间：${formatTime(task.createdAt)}`]
  if (task.actor) lines.push(`提交人：${task.actor}`)
  if (task.target) lines.push(`影响对象：${task.target.kind}「${task.target.label}」`)
  if (task.finishedAt !== undefined) lines.push(`结束时间：${formatTime(task.finishedAt)}`)
  return lines
}

/* ---------- 全局命令受权限约束 ---------- */

/**
 * 命令面板里的一条命令，带上它需要的权限。
 *
 * 复用 `command.ts` 的 `CommandItem`（key / label / keywords / group 与那套
 * 匹配打分都在那儿），这里只多一个 `permission`——命令的搜索排序与权限判定
 * 是两件事，把它们合成一份类型，改排序就会牵动权限。
 */
export interface GuardedCommand extends CommandItem {
  /** 需要的权限。不给表示人人可用 */
  permission?: string
}

export interface CommandEntry {
  command: GuardedCommand
  disabled: boolean
  /** 禁用的理由。摆在条目上，不是藏在提示里 */
  reason: string
}

/**
 * 命令面板里该出现哪些命令。
 *
 * 与详情页的动作同一套口径（见 `detail.ts`）：**没权限的命令照常出现，
 * 但禁用并写明理由**。直接过滤掉的话，用户搜「导出」搜不到，
 * 会以为系统没有这个功能，转头去问「你们这儿能导出吗」——
 * 而正确答案是「能，但你这个角色不行」。
 *
 * 匹配与排序交给 `searchCommands`，不另写一份：命令面板里换一套打分，
 * 用户按回车执行到的就不是同一条命令了。
 */
export function commandEntries(
  commands: readonly GuardedCommand[],
  keyword: string,
  can: (permission: string) => boolean
): CommandEntry[] {
  const byKey = new Map(commands.map((command) => [command.key, command]))
  const matched = keyword.trim()
    ? searchCommands([...commands], keyword).map((match) => match.item)
    : [...commands]
  return matched.map((item) => {
    const command = byKey.get(item.key) ?? (item as GuardedCommand)
    const allowed = !command.permission || can(command.permission)
    return {
      command,
      disabled: !allowed,
      reason: allowed ? '' : '当前角色没有这个权限'
    }
  })
}

/** 回车会执行的那一条：第一条**可用**的命令，不是第一条 */
export function firstRunnable(entries: readonly CommandEntry[]): CommandEntry | null {
  return entries.find((entry) => !entry.disabled) ?? null
}
