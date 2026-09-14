/**
 * 传输层的回归测试。
 *
 * 这里测的三件事在开发机上一件都不会自然发生：断流、取消、重连之后的重复。
 * 所以 mock 必须能主动造出来——造不出来的话，重连那段代码永远没被跑过，
 * 而它正是这一层存在的理由。
 */
import { describe, expect, it } from 'vitest'
import type { RunEvent } from '../contracts/run'
import { createMockTransport, createRunner, createSseDecoder } from './transport'
import { emptyRun, messageText, replay } from './run'

const RUN = 'run-1'
function script(): RunEvent[] {
  let seq = 0
  const ev = (event: Record<string, unknown>) =>
    ({ runId: RUN, seq: (seq += 1), at: 1_700_000_000_000 + seq, ...event }) as RunEvent
  return [
    ev({ type: 'run.started' }),
    ev({ type: 'message.started', messageId: 'm1', role: 'assistant' }),
    ev({ type: 'part.delta', messageId: 'm1', partId: 'p1', kind: 'text', text: '前半' }),
    ev({ type: 'part.delta', messageId: 'm1', partId: 'p1', kind: 'text', text: '后半' }),
    ev({ type: 'message.completed', messageId: 'm1' }),
    ev({ type: 'run.completed' })
  ]
}

/** 测试里不真的等：退避时长本身由 backoff 决定，不需要靠睡觉验证 */
const nowait = async () => {}

describe('运行传输', () => {
  it('顺利跑完：事件按序到达，游标停在最后一条', async () => {
    const received: RunEvent[] = []
    const runner = createRunner({
      transport: createMockTransport({ events: script() }),
      wait: nowait,
      onEvent: (event) => received.push(event)
    })
    await runner.run()
    expect(received.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5, 6])
    expect(runner.cursor).toBe(6)
    expect(runner.state).toBe('closed')
  })

  it('断线恢复带游标，重连之后内容不会念第二遍', async () => {
    const received: RunEvent[] = []
    const transport = createMockTransport({ events: script(), dropAfter: 3 })
    const runner = createRunner({ transport, wait: nowait, onEvent: (e) => received.push(e) })
    await runner.run()

    // 第二次请求必须带着游标，否则服务端会从头再发一遍
    expect(transport.requests.length).toBe(2)
    expect(transport.requests[1].cursor).toBe(3)
    expect(received.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5, 6])

    // 折叠出来的正文只有一份，没有回声
    const state = replay(emptyRun('c1', RUN), received)
    expect(messageText(state.conversation.messages[0])).toBe('前半后半')
  })

  it('服务端把游标那一条又发了一遍时，重复的 seq 不往下传', async () => {
    const events = script()
    const received: RunEvent[] = []
    // 这个 mock 故意忽略游标，把全部事件从头再发一次
    const transport = {
      requests: [] as unknown[],
      stream() {
        return {
          async *[Symbol.asyncIterator]() { for (const event of events) yield event }
        }
      }
    }
    const runner = createRunner({ transport, wait: nowait, onEvent: (e) => received.push(e) })
    await runner.run()
    await runner.run() // 同一个 runner 再跑一次不该开出第二条流
    expect(received.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('取消之后晚到的片段不续写', async () => {
    const received: RunEvent[] = []
    const runner = createRunner({
      transport: createMockTransport({ events: script() }),
      wait: nowait,
      onEvent: (event) => {
        received.push(event)
        // 收到第一片正文就按下停止
        if (event.seq === 3) runner.cancel()
      }
    })
    await runner.run()
    expect(received.map((e) => e.seq)).toEqual([1, 2, 3])
    expect(runner.state).toBe('closed')
    const state = replay(emptyRun('c1', RUN), received)
    expect(messageText(state.conversation.messages[0])).toBe('前半')
  })

  it('幂等键：首次连接与恢复用的键不同，同一次恢复的键稳定', async () => {
    const transport = createMockTransport({ events: script(), dropAfter: 2 })
    const runner = createRunner({ transport, wait: nowait, onEvent: () => {} })
    await runner.run()
    expect(transport.requests[0].idempotencyKey).toBe('run-start')
    expect(transport.requests[1].idempotencyKey).toBe('run-resume-2')
  })

  it('重试用尽之后抛出，不再自己重连', async () => {
    const transport = createMockTransport({ events: script(), dropAfter: 1, dropTimes: 99 })
    const attempts: number[] = []
    const runner = createRunner({
      transport,
      backoff: [1, 1],
      wait: nowait,
      onEvent: () => {},
      onError: (_error, attempt) => attempts.push(attempt)
    })
    await expect(runner.run()).rejects.toThrow(/连接断开/)
    expect(attempts).toEqual([0, 1, 2])
    expect(runner.state).toBe('closed')
  })

  it('连接状态按顺序变化，UI 据此显示排队/连接/生成', async () => {
    const states: string[] = []
    const runner = createRunner({
      transport: createMockTransport({ events: script(), dropAfter: 3 }),
      wait: nowait,
      onEvent: () => {},
      onState: (state) => states.push(state)
    })
    await runner.run()
    expect(states).toEqual(['connecting', 'streaming', 'reconnecting', 'streaming', 'closed'])
  })
})

describe('SSE 解码', () => {
  it('分片边界落在帧中间时，半截帧留到下一块', () => {
    const decoder = createSseDecoder()
    expect(decoder.push('data: {"a":1}\n\ndata: {"b"')).toEqual(['{"a":1}'])
    expect(decoder.push(':2}\n\n')).toEqual(['{"b":2}'])
    expect(decoder.pending).toBe('')
  })

  it('多行 data 拼成一条，[DONE] 不当成数据', () => {
    const decoder = createSseDecoder()
    expect(decoder.push('data: 第一行\ndata: 第二行\n\ndata: [DONE]\n\n')).toEqual(['第一行\n第二行'])
  })

  it('没有以空行收尾的最后一帧留在缓冲里，不当成完整帧发出去', () => {
    const decoder = createSseDecoder()
    expect(decoder.push('data: 半截')).toEqual([])
    expect(decoder.pending).toBe('data: 半截')
  })
})
