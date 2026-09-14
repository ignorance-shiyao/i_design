/**
 * 运行事件 reducer 的回归测试。
 *
 * 重点全在「网络不听话」的那几种情况上：乱序、重发、终态之后还在吐、
 * 指向不存在的目标。这几种在开发机上都不会自然发生——本地 mock 总是
 * 按顺序、不重复、说停就停，所以只能在这里造出来。
 */
import { describe, expect, it } from 'vitest'
import type { RunEvent } from '../contracts/run'
import { applyEvent, emptyRun, messageText, missingSeqs, replay } from './run'

const RUN = 'run-1'
let seq = 0
/** 联合类型要逐个成员去掉公共字段，直接 Omit 会把各分支特有的字段一起丢掉 */
type EventInput<T = RunEvent> = T extends RunEvent
  ? Omit<T, 'runId' | 'seq' | 'at'> & { at?: number }
  : never

const ev = (event: EventInput): RunEvent =>
  ({ runId: RUN, seq: (seq += 1), at: event.at ?? 1_700_000_000_000 + seq, ...event } as RunEvent)

/** 一次典型运行：开场 → 两片正文 → 工具 → 产物 → 完成 */
function script(): RunEvent[] {
  seq = 0
  return [
    ev({ type: 'run.started' }),
    ev({ type: 'message.started', messageId: 'm1', role: 'assistant' }),
    ev({ type: 'part.delta', messageId: 'm1', partId: 'p1', kind: 'text', text: '正在查' }),
    ev({ type: 'tool.called', toolCallId: 't1', name: 'search', input: { q: '库存' } }),
    ev({ type: 'tool.result', toolCallId: 't1', status: 'succeeded', output: { hits: 3 } }),
    ev({ type: 'part.delta', messageId: 'm1', partId: 'p1', kind: 'text', text: '库存。' }),
    ev({ type: 'artifact.emitted', artifactId: 'a1', kind: 'table', title: '库存明细', version: 1 }),
    ev({ type: 'message.completed', messageId: 'm1' }),
    ev({ type: 'run.completed' })
  ] as RunEvent[]
}

const shuffle = (list: RunEvent[], seed: number) => {
  const out = [...list]
  let state = seed
  for (let i = out.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) % 2147483648
    const j = state % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

describe('运行事件 reducer', () => {
  it('按顺序重放：正文、工具、产物、终态都落到位', () => {
    const state = replay(emptyRun('c1', RUN), script())
    expect(state.conversation.status).toBe('completed')
    expect(messageText(state.conversation.messages[0])).toBe('正在查库存。')
    expect(state.conversation.messages[0].complete).toBe(true)
    expect(state.conversation.messages[0].parts[0].complete).toBe(true)
    expect(state.conversation.toolCalls[0].status).toBe('succeeded')
    expect(state.conversation.artifacts).toHaveLength(1)
    expect(state.dropped).toEqual([])
  })

  it('乱序到达不影响结果：任意顺序折叠出的状态与顺序重放一致', () => {
    const ordered = replay(emptyRun('c1', RUN), script())
    for (const seed of [1, 7, 42, 99, 12345]) {
      const state = replay(emptyRun('c1', RUN), shuffle(script(), seed))
      expect(state.conversation).toEqual(ordered.conversation)
      expect(state.pending).toEqual([])
    }
  })

  it('重发的事件被判为重复，不会让正文出现回声', () => {
    const events = script()
    const twice = [...events, ...events]
    const state = replay(emptyRun('c1', RUN), twice)
    expect(messageText(state.conversation.messages[0])).toBe('正在查库存。')
    expect(state.conversation.toolCalls).toHaveLength(1)
    expect(state.dropped.filter((d) => d.reason === 'duplicate')).toHaveLength(events.length)
  })

  it('取消之后晚到的片段不续写', () => {
    seq = 0
    const events = [
      ev({ type: 'run.started' }),
      ev({ type: 'message.started', messageId: 'm1', role: 'assistant' }),
      ev({ type: 'part.delta', messageId: 'm1', partId: 'p1', kind: 'text', text: '开头' }),
      ev({ type: 'run.cancelled' }),
      ev({ type: 'part.delta', messageId: 'm1', partId: 'p1', kind: 'text', text: '还在写' }),
      ev({ type: 'run.completed' })
    ] as RunEvent[]
    const state = replay(emptyRun('c1', RUN), events)
    expect(state.conversation.status).toBe('cancelled')
    expect(messageText(state.conversation.messages[0])).toBe('开头')
    expect(state.dropped.map((d) => d.reason)).toEqual(['after-terminal', 'after-terminal'])
  })

  it('重连后服务端把终态再发一遍，不算异常', () => {
    seq = 0
    const events = [ev({ type: 'run.started' }), ev({ type: 'run.completed' })] as RunEvent[]
    const again = { ...events[1], seq: 3 } as RunEvent
    const state = replay(emptyRun('c1', RUN), [...events, again])
    expect(state.conversation.status).toBe('completed')
    expect(state.dropped).toEqual([])
  })

  it('指向不存在的消息或工具时丢弃并记账，不凭空创建', () => {
    seq = 0
    const events = [
      ev({ type: 'run.started' }),
      ev({ type: 'part.delta', messageId: '不存在', partId: 'p1', kind: 'text', text: 'x' }),
      ev({ type: 'tool.result', toolCallId: '不存在', status: 'succeeded' })
    ] as RunEvent[]
    const state = replay(emptyRun('c1', RUN), events)
    expect(state.conversation.messages).toEqual([])
    expect(state.dropped.map((d) => d.reason)).toEqual(['unknown-target', 'unknown-target'])
  })

  it('别的运行的事件不会串进来', () => {
    seq = 0
    const mine = ev({ type: 'run.started' })
    const other = { ...ev({ type: 'run.cancelled' }), runId: 'run-2' } as RunEvent
    const state = replay(emptyRun('c1', RUN), [mine, other])
    expect(state.conversation.status).toBe('streaming')
    expect(state.dropped[0].reason).toBe('foreign-run')
  })

  it('缺口未补上时事件在等待区里等着，能说出还差第几条', () => {
    seq = 0
    const [started, message, delta] = script()
    let state = applyEvent(emptyRun('c1', RUN), started)
    state = applyEvent(state, delta) // 第 3 条先到，第 2 条还没来
    expect(state.pending).toHaveLength(1)
    expect(missingSeqs(state)).toEqual([2])
    state = applyEvent(state, message)
    expect(state.pending).toEqual([])
    expect(messageText(state.conversation.messages[0])).toBe('正在查')
  })

  it('确认重复点击是幂等的，先到的决定说了算', () => {
    seq = 0
    const events = [
      ev({ type: 'run.started' }),
      ev({ type: 'approval.requested', approvalId: 'ap1', action: 'purchase.create', summary: '创建采购单' }),
      ev({ type: 'approval.resolved', approvalId: 'ap1', decision: 'approved' }),
      ev({ type: 'approval.resolved', approvalId: 'ap1', decision: 'rejected' })
    ] as RunEvent[]
    const state = replay(emptyRun('c1', RUN), events)
    expect(state.conversation.approvals[0].decision).toBe('approved')
    expect(state.conversation.status).toBe('streaming')
    expect(state.dropped.map((d) => d.reason)).toEqual(['duplicate'])
  })

  it('产物的新版本是追加，不覆盖旧的', () => {
    seq = 0
    const events = [
      ev({ type: 'run.started' }),
      ev({ type: 'artifact.emitted', artifactId: 'a1', kind: 'document', title: '方案', version: 1 }),
      ev({ type: 'artifact.emitted', artifactId: 'a1', kind: 'document', title: '方案', version: 2 })
    ] as RunEvent[]
    const state = replay(emptyRun('c1', RUN), events)
    expect(state.conversation.artifacts.map((a) => a.version)).toEqual([1, 2])
  })
})
