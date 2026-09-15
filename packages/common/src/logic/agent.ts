/**
 * 智能体交互的共享逻辑。
 *
 * 这些形态的共同点是：状态由智能体推进，用户只在关键处介入。
 * 因此判断逻辑（能不能继续、进度到哪、置信度怎么表述）必须只有一份，
 * 否则各端会在「什么时候允许点继续」这类地方给出不同答案。
 */

/* ---------- 征求确认 ---------- */

export interface ApprovalOption {
  value: string
  label: string
  /** 附加说明，比如「（核心线）」 */
  hint?: string
}

export interface ApprovalQuestion {
  id: string
  title: string
  options: ApprovalOption[]
  /** 允许多选 */
  multiple?: boolean
  /** 提供「其他」自由输入 */
  allowCustom?: boolean
  customPlaceholder?: string
  /** 可跳过：不是所有问题都必须回答 */
  skippable?: boolean
}

export type ApprovalAnswer = { values: string[]; custom?: string } | { skipped: true }

/**
 * 能否进入下一题。
 *
 * 有自由输入时，填了文字也算已回答——否则用户写完「其他」的内容却发现
 * 继续按钮仍然是灰的，只能回头再去点一个不想选的选项。
 */
export function canAdvance(
  question: ApprovalQuestion,
  selected: Iterable<string>,
  custom = ''
): boolean {
  if (question.skippable) return true
  return [...selected].length > 0 || custom.trim().length > 0
}

/** 当前进度文本，如「2/3」 */
export function approvalProgress(index: number, total: number): string {
  return `${Math.min(index + 1, total)}/${total}`
}

/** 单选时替换、多选时切换 */
export function toggleApprovalValue(
  question: ApprovalQuestion,
  selected: Iterable<string>,
  value: string
): string[] {
  if (!question.multiple) return [value]
  const next = new Set(selected)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return [...next]
}

/* ---------- 确认还作不作数 ---------- */

/**
 * 一条待确认在这一刻还能不能拍板。
 *
 * 征求确认的卡片会在屏幕上待很久——人去开了个会、切走看别的、合上笔记本。
 * 回来时那个动作可能已经不该再执行了，而卡片长得和刚发出来时一模一样：
 * 按钮还亮着，点下去要么服务端报一个看不懂的错，要么更糟——真的执行了一次
 * 基于旧前提的操作。
 *
 * 两种「不该再执行」要分开说，因为出口不同：
 *
 *   过期      只是等太久了，前提没变。出口是重新发起同一次确认。
 *   版本失效  被确认的东西在这期间改了。出口不是重发，是先看新版本——
 *             对着 v2 点的「同意」不该落到 v3 上。
 *
 * 两者同时成立时以版本失效为准：给一条针对旧版本的确认续期，
 * 等于把「内容变了」这件事悄悄抹掉。
 */
export type ApprovalGateState = 'open' | 'expiring' | 'expired' | 'stale'

export interface ApprovalGateInput {
  /** 过期时刻（毫秒时间戳）。不给表示这条确认不过期 */
  expiresAt?: number
  now: number
  /** 这条确认是针对哪个版本发出的 */
  version?: number
  /** 被确认的东西现在是第几版 */
  currentVersion?: number
  /** 快到期的提前量（毫秒）。默认 30 秒 */
  warnBefore?: number
}

export interface ApprovalGate {
  state: ApprovalGateState
  /** 这一刻还能不能做决定。false 时选项与确认按钮都要停用 */
  decidable: boolean
  /** 距离过期还有几秒。没有期限或已过期时是 undefined */
  remaining?: number
  /** 状态本身。颜色不是唯一线索，这句话必须出现 */
  label: string
  detail: string
  /** 这一刻该给的出口 */
  action: 'none' | 'renew' | 'review'
}

/** 默认提前 30 秒开始报剩余时间：再早会变成一直在催，再晚来不及反应 */
export const APPROVAL_WARN_BEFORE = 30_000

/**
 * 剩余秒数。
 *
 * 向上取整，和重试倒计时同一个理由：显示「10 秒」时真实剩余不超过 10 秒。
 * 向下取整会先显示「0 秒」再等一下才真的过期。
 */
export function approvalRemaining(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / 1000))
}

export function approvalGate(input: ApprovalGateInput): ApprovalGate {
  const { expiresAt, now, version, currentVersion } = input
  const warnBefore = input.warnBefore ?? APPROVAL_WARN_BEFORE

  // 版本失效压过过期：给一条针对旧版本的确认续期，等于把「内容变了」悄悄抹掉
  if (version !== undefined && currentVersion !== undefined && currentVersion !== version) {
    return {
      state: 'stale',
      decidable: false,
      label: '内容已更新',
      detail: `这条确认是针对第 ${version} 版发出的，现在是第 ${currentVersion} 版`,
      action: 'review'
    }
  }

  if (expiresAt === undefined) {
    return { state: 'open', decidable: true, label: '待确认', detail: '', action: 'none' }
  }

  const remaining = approvalRemaining(expiresAt, now)
  if (remaining <= 0) {
    return {
      state: 'expired',
      decidable: false,
      label: '已过期',
      detail: '这条确认等待太久已失效，需要重新发起',
      action: 'renew'
    }
  }

  if (expiresAt - now <= warnBefore) {
    return {
      state: 'expiring',
      decidable: true,
      remaining,
      label: '即将过期',
      detail: `还有 ${remaining} 秒`,
      action: 'none'
    }
  }

  return { state: 'open', decidable: true, remaining, label: '待确认', detail: '', action: 'none' }
}

/* ---------- 任务行 ---------- */

export type AgentTaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AgentTask {
  id: string
  title: string
  status: AgentTaskStatus
  /** 右侧的量化结果，如「12 个供应商」 */
  meta?: string
  /** 展开后的细节 */
  detail?: string
  /** 运行中的序号，用于在圆圈里显示第几步 */
  step?: number
}

export interface TaskSummary {
  total: number
  completed: number
  failed: number
  running: number
  /** 全部结束（无进行中与待办） */
  settled: boolean
  /** 0–100 */
  percent: number
}

/**
 * 任务列表的汇总。
 *
 * percent 把失败也算作「已结束」，否则一个永远失败的任务会让进度条
 * 卡在 90% 不动，用户以为还在跑。
 */
export function summarizeTasks(tasks: AgentTask[]): TaskSummary {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  const failed = tasks.filter((t) => t.status === 'failed').length
  const running = tasks.filter((t) => t.status === 'running').length
  const settledCount = completed + failed
  return {
    total,
    completed,
    failed,
    running,
    settled: total > 0 && settledCount === total,
    percent: total === 0 ? 0 : Math.round((settledCount / total) * 100)
  }
}

/* ---------- 建议卡的置信度 ---------- */

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface Confidence {
  level: ConfidenceLevel
  /** 点亮几格，共 3 格 */
  bars: number
  label: string
}

/**
 * 把 0–1 的置信度分档。
 *
 * 用三档而不是直接显示百分比：模型给出的 0.73 并不比 0.71 更可信，
 * 把它当成精确数字展示会让用户对它做过度解读。
 * 同时给出文字标签——格子数是视觉线索，不能作为唯一表达。
 */
export function confidenceOf(score: number): Confidence {
  const value = Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : 0
  if (value >= 0.75) return { level: 'high', bars: 3, label: '高置信度' }
  if (value >= 0.45) return { level: 'medium', bars: 2, label: '中等置信度' }
  return { level: 'low', bars: 1, label: '低置信度' }
}

/* ---------- 上下文卡（检索到的知识片段） ---------- */

export interface ContextChunk {
  id: string
  title: string
  content: string
  /** 出处文件名，用于取类型图标 */
  source?: string
  /** 出处链接 */
  href?: string
  /** 检索相关度 0–1，可选 */
  score?: number
}

/**
 * 片段的字符数展示。
 *
 * 用字符数而不是 token 数：token 是模型的内部单位，同一段文字在不同模型下
 * 数值不同，用户无从判断这个数字意味着什么；字符数至少和他看到的内容对得上。
 */
export function chunkLength(content: string): number {
  return [...content].length
}

/** 超长片段折叠后的预览文本，按字符截断并补省略号 */
export function chunkPreview(content: string, limit = 140): string {
  const chars = [...content]
  return chars.length <= limit ? content : `${chars.slice(0, limit).join('')}…`
}

/* ---------- 差异表（智能体提出的成批改动） ---------- */

export type DiffRowKind = 'added' | 'removed' | 'changed' | 'unchanged'

export interface DiffCell {
  value: string
  /** 变更前的值；有它才渲染删除线 */
  before?: string
}

export interface DiffRow {
  id: string
  kind: DiffRowKind
  cells: Record<string, DiffCell>
}

export interface DiffSummary {
  added: number
  removed: number
  changed: number
  /** 已勾选的改动数 —— 底部按钮上的 N */
  selected: number
  /** 有改动的行总数（不含未变行） */
  total: number
}

/**
 * 差异统计。
 *
 * 未变的行不计入总数——它们只是上下文，让用户看清改动落在哪里。
 * 把它们算进「共 N 处改动」会让数字大得没有意义。
 */
export function summarizeDiff(rows: DiffRow[], selected: Iterable<string>): DiffSummary {
  const picked = new Set(selected)
  const changedRows = rows.filter((r) => r.kind !== 'unchanged')
  return {
    added: changedRows.filter((r) => r.kind === 'added').length,
    removed: changedRows.filter((r) => r.kind === 'removed').length,
    changed: changedRows.filter((r) => r.kind === 'changed').length,
    selected: changedRows.filter((r) => picked.has(r.id)).length,
    total: changedRows.length
  }
}

/** 默认全选所有改动：智能体给的是一整套方案，逐个勾选反而是例外 */
export function defaultDiffSelection(rows: DiffRow[]): string[] {
  return rows.filter((r) => r.kind !== 'unchanged').map((r) => r.id)
}

/** 切换一行的采纳状态；未变行不可切换 */
export function toggleDiffRow(
  rows: DiffRow[],
  selected: Iterable<string>,
  id: string
): string[] {
  const row = rows.find((r) => r.id === id)
  if (!row || row.kind === 'unchanged') return [...selected]
  const next = new Set(selected)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return [...next]
}

/** 底部按钮文案：没有勾选时说清楚为什么不能点 */
export function diffActionLabel(summary: DiffSummary): string {
  if (summary.total === 0) return '没有需要应用的改动'
  if (summary.selected === 0) return '未选择改动'
  return `应用 ${summary.selected} 处改动`
}
