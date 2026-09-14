/**
 * 异常控制台与确定性重放。
 *
 * 重点是「确定性」：乱序、重复、断线都要能造出来，而且同一个 seed 造出来的
 * 完全一样——不然失败复现不了，视觉快照也每跑一次不一样。
 */
import { describe, expect, it } from 'vitest'
import { emptyRun, messageText, replay as fold, type RunEvent } from '@i-design/common'
import { createFaultConsole, FAULTS } from './faults'
import { planDelivery } from './replay'

const RUN = 'run-1'
function script(): RunEvent[] {
  let seq = 0
  const ev = (event: Record<string, unknown>) =>
    ({ runId: RUN, seq: (seq += 1), at: 1_700_000_000_000 + seq, ...event }) as RunEvent
  return [
    ev({ type: 'run.started' }),
    ev({ type: 'message.started', messageId: 'm1', role: 'assistant' }),
    ev({ type: 'part.delta', messageId: 'm1', partId: 'p1', kind: 'text', text: '一' }),
    ev({ type: 'part.delta', messageId: 'm1', partId: 'p1', kind: 'text', text: '二' }),
    ev({ type: 'part.delta', messageId: 'm1', partId: 'p1', kind: 'text', text: '三' }),
    ev({ type: 'message.completed', messageId: 'm1' }),
    ev({ type: 'run.completed' })
  ]
}

describe('异常控制台', () => {
  it('每一种异常都在清单里，且文案只有一份', () => {
    const values = FAULTS.map((f) => f.value)
    for (const kind of ['forbidden', 'conflict', 'rate-limit', 'timeout', 'partial', 'out-of-order', 'reconnect']) {
      expect(values).toContain(kind)
    }
    expect(new Set(values).size).toBe(values.length)
    expect(FAULTS.every((f) => f.label && f.hint)).toBe(true)
  })

  it('切换会通知订阅者，一键恢复回到正常', () => {
    const console_ = createFaultConsole()
    const seen: string[] = []
    const off = console_.subscribe((kind) => seen.push(kind))
    console_.set('conflict')
    console_.set('conflict') // 同一个值不重复通知
    console_.reset()
    off()
    console_.set('timeout')
    expect(seen).toEqual(['conflict', 'none'])
    expect(console_.current).toBe('timeout')
  })
})

describe('确定性重放', () => {
  it('不注入异常时就是原样投递', () => {
    const events = script()
    expect(planDelivery(events).map((d) => d.event.seq)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('同一个 seed 得到同一个投递顺序', () => {
    const a = planDelivery(script(), { shuffleWindow: 3, duplicateRate: 0.3, seed: 9 })
    const b = planDelivery(script(), { shuffleWindow: 3, duplicateRate: 0.3, seed: 9 })
    expect(a.map((d) => `${d.event.seq}${d.duplicate ? 'd' : ''}`))
      .toEqual(b.map((d) => `${d.event.seq}${d.duplicate ? 'd' : ''}`))
  })

  it('乱序只在窗口内发生——真实网络不会把第一条排到最后', () => {
    const delivered = planDelivery(script(), { shuffleWindow: 3, seed: 4 }).map((d) => d.event.seq)
    expect([...delivered].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7])
    for (const [index, seq] of delivered.entries()) {
      expect(Math.abs(seq - 1 - index)).toBeLessThan(3)
    }
  })

  it('断线恢复会把游标那一条再发一遍，好让「念了两遍」能被测出来', () => {
    const plan = planDelivery(script(), { dropAfter: 3 })
    const resend = plan.find((d) => d.duplicate && d.afterReconnect)
    expect(resend).toBeTruthy()
    expect(plan.filter((d) => d.afterReconnect).length).toBeGreaterThan(0)
  })

  it('不论怎么乱序、重复、断线，折叠出来的正文都只有一份', () => {
    for (const seed of [1, 2, 3, 7, 11]) {
      const plan = planDelivery(script(), { shuffleWindow: 3, duplicateRate: 0.4, dropAfter: 4, seed })
      const state = fold(emptyRun('c1', RUN), plan.map((d) => d.event))
      expect(messageText(state.conversation.messages[0])).toBe('一二三')
      expect(state.conversation.status).toBe('completed')
    }
  })
})
