/**
 * 一次智能体运行的事件契约。
 *
 * 为什么要有这一层：各家供应商的流式格式互不相同，字段名、分片粒度、
 * 终止方式都不一样。如果 UI 直接解析供应商的字段，换一家就要把所有组件
 * 改一遍，而「消息渲染到一半断了」这类问题会散落在每个组件里各修一次。
 *
 * 所以约定：**传输适配层把供应商的原始数据翻译成这里的事件，UI 只认这些事件**。
 * 原始数据放在 `raw` 里仅供排查，任何组件都不许读它——一旦有人从 raw 里
 * 取字段，这层翻译就白做了。
 *
 * 事件必须带单调递增的 `seq`。网络会乱序、会重发、会在取消之后还吐出几片，
 * 没有序号就没法判断「这片是迟到的还是新的」，只能靠时间戳猜，而时间戳
 * 在重连之后并不可靠。
 */

/** 运行的生命周期。终态三个：完成、失败、取消 */
export type RunStatus =
  | 'queued'
  | 'connecting'
  | 'streaming'
  | 'awaiting-approval'
  | 'completed'
  | 'failed'
  | 'cancelled'

export const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'] as const

export function isTerminal(status: RunStatus): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status)
}

/** 消息由若干段组成：正文、推理、代码、工具调用、产物引用…… */
export type MessagePartKind = 'text' | 'reasoning' | 'code' | 'tool' | 'artifact' | 'citation'

export interface MessagePart {
  id: string
  kind: MessagePartKind
  /** 正文。流式期间是已到达的部分 */
  text: string
  /** code 段的语言；citation 段的来源；tool/artifact 段指向对应的 id */
  meta?: Readonly<Record<string, string>>
  /** 这一段是否已经收完。未收完的段不该被当成最终内容去做摘要或导出 */
  complete: boolean
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: MessagePart[]
  createdAt: number
  complete: boolean
}

export type ToolCallStatus = 'running' | 'succeeded' | 'failed' | 'cancelled'

export interface ToolCall {
  id: string
  name: string
  /** 已脱敏的入参摘要。密钥与完整提示词不进这里 */
  input: Readonly<Record<string, unknown>>
  status: ToolCallStatus
  output?: unknown
  error?: string
  startedAt: number
  endedAt?: number
}

export interface Artifact {
  id: string
  kind: 'document' | 'table' | 'code' | 'chart' | 'file'
  title: string
  /** 同一个产物可以有多个版本；采纳与撤销按版本走 */
  version: number
  createdAt: number
  meta?: Readonly<Record<string, string>>
}

export type ApprovalDecision = 'approved' | 'rejected' | 'expired' | 'cancelled'

export interface Approval {
  id: string
  /** 这次确认绑定的运行与动作：重复点击要幂等，过期要能重新确认 */
  runId: string
  action: string
  summary: string
  requestedAt: number
  expiresAt?: number
  decision?: ApprovalDecision
  decidedAt?: number
}

interface Base {
  runId: string
  /** 从 1 开始，同一次运行内单调递增。重发的事件带同一个 seq */
  seq: number
  at: number
  /** 供应商原始数据，仅供排查。UI 不许读 */
  raw?: unknown
}

export type RunEvent =
  | (Base & { type: 'run.started' })
  | (Base & { type: 'message.started'; messageId: string; role: Message['role'] })
  | (Base & { type: 'part.delta'; messageId: string; partId: string; kind: MessagePartKind; text: string; meta?: Record<string, string> })
  | (Base & { type: 'part.completed'; messageId: string; partId: string })
  | (Base & { type: 'message.completed'; messageId: string })
  | (Base & { type: 'tool.called'; toolCallId: string; name: string; input: Record<string, unknown> })
  | (Base & { type: 'tool.result'; toolCallId: string; status: Exclude<ToolCallStatus, 'running'>; output?: unknown; error?: string })
  | (Base & { type: 'approval.requested'; approvalId: string; action: string; summary: string; expiresAt?: number })
  | (Base & { type: 'approval.resolved'; approvalId: string; decision: ApprovalDecision })
  | (Base & { type: 'artifact.emitted'; artifactId: string; kind: Artifact['kind']; title: string; version: number; meta?: Record<string, string> })
  | (Base & { type: 'run.completed' })
  | (Base & { type: 'run.failed'; error: string })
  | (Base & { type: 'run.cancelled' })

export interface Conversation {
  id: string
  title?: string
  runId?: string
  status: RunStatus
  messages: Message[]
  toolCalls: ToolCall[]
  artifacts: Artifact[]
  approvals: Approval[]
  error?: string
}

/** 被丢弃的事件与原因。计数是给可观测性用的，也是排查「消息少了一段」的第一现场 */
export type DropReason = 'duplicate' | 'after-terminal' | 'unknown-target' | 'foreign-run'

export interface RunState {
  conversation: Conversation
  /** 已经应用到的连续序号。它之后的事件要么正好接上，要么进等待区 */
  appliedSeq: number
  /** 乱序先到的事件，按 seq 存着，等缺口补上再按序应用 */
  pending: RunEvent[]
  dropped: { seq: number; type: RunEvent['type']; reason: DropReason }[]
}
