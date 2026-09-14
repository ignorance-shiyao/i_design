/**
 * 运行事件的 reducer：把一串事件折叠成一个可渲染的会话状态。
 *
 * 这一层要解决的是网络的四件事，它们在真实链路上一定会发生：
 *
 * - **乱序**：第 5 条比第 4 条先到。直接应用会让正文顺序错乱，
 *   所以缺口未补上之前先存着，补上了再按序应用。
 * - **重发**：同一个 seq 收到两次。重复应用会让流式正文出现「回声」——
 *   同一段文字出现两遍，而且看起来像模型自己写重了。
 * - **迟到**：终态之后还吐出几片。取消之后继续续写是最糟的一种：
 *   用户按了停止，字却还在往外冒。
 * - **未知目标**：delta 指向一条没开始过的消息。丢掉并记账，
 *   不要顺手把它创建出来——那样会把「协议错了」变成「界面上莫名多一条消息」。
 *
 * 丢弃不是静默的：每一条都记在 dropped 里，带上原因。
 * 「消息少了一段」的排查第一现场就是它。
 *
 * 确定性：给定同一批事件，不论以什么顺序喂进来，折叠出的状态完全一致。
 * 测试里用打乱顺序、重复、成倍重放来钉住这一点。
 */
import type {
  Approval, Artifact, Conversation, DropReason, Message, MessagePart,
  RunEvent, RunState, ToolCall
} from '../contracts/run'
import { isTerminal } from '../contracts/run'

export function emptyRun(conversationId: string, runId?: string): RunState {
  return {
    conversation: {
      id: conversationId,
      runId,
      status: 'queued',
      messages: [],
      toolCalls: [],
      artifacts: [],
      approvals: []
    },
    appliedSeq: 0,
    pending: [],
    dropped: []
  }
}

const drop = (state: RunState, event: RunEvent, reason: DropReason): RunState => ({
  ...state,
  dropped: [...state.dropped, { seq: event.seq, type: event.type, reason }]
})

/**
 * 应用一条事件。
 *
 * 外部只用这个入口，它负责排序与去重；真正改状态的是下面的 reduce。
 */
export function applyEvent(state: RunState, event: RunEvent): RunState {
  if (state.conversation.runId && event.runId !== state.conversation.runId) {
    return drop(state, event, 'foreign-run')
  }
  if (event.seq <= state.appliedSeq) return drop(state, event, 'duplicate')
  if (state.pending.some((p) => p.seq === event.seq)) return drop(state, event, 'duplicate')

  // 缺口还没补上：先存着。等缺的那条到了，连同它后面连续的一起应用
  if (event.seq > state.appliedSeq + 1) {
    return { ...state, pending: [...state.pending, event].sort((a, b) => a.seq - b.seq) }
  }

  let next = applyInOrder(state, event)
  // 接上之后，等待区里可能已经连成一串了
  while (next.pending.length && next.pending[0].seq === next.appliedSeq + 1) {
    const [head, ...rest] = next.pending
    next = applyInOrder({ ...next, pending: rest }, head)
  }
  return next
}

function applyInOrder(state: RunState, event: RunEvent): RunState {
  const advanced = { ...state, appliedSeq: event.seq }
  /*
   * 终态之后只认「同一个终态又说了一遍」，其余一律丢弃。
   * 允许重复的终态是因为重连之后服务端常会把最后一条再发一次；
   * 允许 delta 则会出现「按了停止字还在冒」。
   */
  if (isTerminal(state.conversation.status)) {
    const sameTerminal =
      (event.type === 'run.completed' && state.conversation.status === 'completed') ||
      (event.type === 'run.failed' && state.conversation.status === 'failed') ||
      (event.type === 'run.cancelled' && state.conversation.status === 'cancelled')
    if (!sameTerminal) return drop(advanced, event, 'after-terminal')
    return advanced
  }
  return reduce(advanced, event)
}

const replaceMessage = (conversation: Conversation, id: string, patch: (m: Message) => Message): Conversation => ({
  ...conversation,
  messages: conversation.messages.map((m) => (m.id === id ? patch(m) : m))
})

function reduce(state: RunState, event: RunEvent): RunState {
  const { conversation } = state
  const set = (patch: Partial<Conversation>): RunState => ({ ...state, conversation: { ...conversation, ...patch } })

  switch (event.type) {
    case 'run.started':
      return set({ status: 'streaming', runId: conversation.runId ?? event.runId })

    case 'message.started': {
      if (conversation.messages.some((m) => m.id === event.messageId)) return drop(state, event, 'duplicate')
      const message: Message = {
        id: event.messageId, role: event.role, parts: [], createdAt: event.at, complete: false
      }
      return set({ status: 'streaming', messages: [...conversation.messages, message] })
    }

    case 'part.delta': {
      const message = conversation.messages.find((m) => m.id === event.messageId)
      // 没开始过的消息不凭空创建：那会把协议错误变成界面上莫名多出来的一条
      if (!message) return drop(state, event, 'unknown-target')
      const existing = message.parts.find((p) => p.id === event.partId)
      const part: MessagePart = existing
        ? { ...existing, text: existing.text + event.text }
        : { id: event.partId, kind: event.kind, text: event.text, meta: event.meta, complete: false }
      return {
        ...state,
        conversation: replaceMessage(conversation, message.id, (m) => ({
          ...m,
          parts: existing ? m.parts.map((p) => (p.id === part.id ? part : p)) : [...m.parts, part]
        }))
      }
    }

    case 'part.completed': {
      const message = conversation.messages.find((m) => m.id === event.messageId)
      if (!message?.parts.some((p) => p.id === event.partId)) return drop(state, event, 'unknown-target')
      return {
        ...state,
        conversation: replaceMessage(conversation, message.id, (m) => ({
          ...m,
          parts: m.parts.map((p) => (p.id === event.partId ? { ...p, complete: true } : p))
        }))
      }
    }

    case 'message.completed': {
      const message = conversation.messages.find((m) => m.id === event.messageId)
      if (!message) return drop(state, event, 'unknown-target')
      return {
        ...state,
        conversation: replaceMessage(conversation, message.id, (m) => ({
          ...m,
          complete: true,
          // 消息收完了，没显式收尾的段也就收完了
          parts: m.parts.map((p) => ({ ...p, complete: true }))
        }))
      }
    }

    case 'tool.called': {
      if (conversation.toolCalls.some((t) => t.id === event.toolCallId)) return drop(state, event, 'duplicate')
      const call: ToolCall = {
        id: event.toolCallId, name: event.name, input: event.input, status: 'running', startedAt: event.at
      }
      return set({ toolCalls: [...conversation.toolCalls, call] })
    }

    case 'tool.result': {
      const call = conversation.toolCalls.find((t) => t.id === event.toolCallId)
      if (!call) return drop(state, event, 'unknown-target')
      if (call.status !== 'running') return drop(state, event, 'duplicate')
      return set({
        toolCalls: conversation.toolCalls.map((t) => (t.id === call.id
          ? { ...t, status: event.status, output: event.output, error: event.error, endedAt: event.at }
          : t))
      })
    }

    case 'approval.requested': {
      if (conversation.approvals.some((a) => a.id === event.approvalId)) return drop(state, event, 'duplicate')
      const approval: Approval = {
        id: event.approvalId,
        runId: event.runId,
        action: event.action,
        summary: event.summary,
        requestedAt: event.at,
        expiresAt: event.expiresAt
      }
      return set({ status: 'awaiting-approval', approvals: [...conversation.approvals, approval] })
    }

    case 'approval.resolved': {
      const approval = conversation.approvals.find((a) => a.id === event.approvalId)
      if (!approval) return drop(state, event, 'unknown-target')
      // 已经定过的不改：重复点击要幂等，先到的那个决定说了算
      if (approval.decision) return drop(state, event, 'duplicate')
      const approvals = conversation.approvals.map((a) => (a.id === approval.id
        ? { ...a, decision: event.decision, decidedAt: event.at }
        : a))
      const waiting = approvals.some((a) => !a.decision)
      return set({ approvals, status: waiting ? 'awaiting-approval' : 'streaming' })
    }

    case 'artifact.emitted': {
      const artifact: Artifact = {
        id: event.artifactId, kind: event.kind, title: event.title,
        version: event.version, createdAt: event.at, meta: event.meta
      }
      const same = conversation.artifacts.find((a) => a.id === artifact.id && a.version === artifact.version)
      if (same) return drop(state, event, 'duplicate')
      // 新版本追加而不是替换：重新生成不能悄悄覆盖旧产物
      return set({ artifacts: [...conversation.artifacts, artifact] })
    }

    case 'run.completed':
      return set({ status: 'completed' })

    case 'run.failed':
      return set({ status: 'failed', error: event.error })

    case 'run.cancelled':
      return set({ status: 'cancelled' })

    default:
      return state
  }
}

/** 重放一整串事件。顺序随意——乱序、重复都由 applyEvent 兜住 */
export function replay(state: RunState, events: readonly RunEvent[]): RunState {
  return events.reduce(applyEvent, state)
}

/** 等待区里还堵着的缺口序号，用于「还在等第几条」这类提示与告警 */
export function missingSeqs(state: RunState): number[] {
  if (!state.pending.length) return []
  const have = new Set(state.pending.map((p) => p.seq))
  const out: number[] = []
  for (let seq = state.appliedSeq + 1; seq < state.pending[state.pending.length - 1].seq; seq += 1) {
    if (!have.has(seq)) out.push(seq)
  }
  return out
}

/** 合并后的正文：UI 渲染用这个，而不是自己去拼 parts */
export function messageText(message: Message): string {
  return message.parts.filter((p) => p.kind === 'text').map((p) => p.text).join('')
}
