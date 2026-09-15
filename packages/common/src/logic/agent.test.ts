/**
 * 确认还作不作数的回归测试。
 *
 * 测的全是「两种失效同时成立时以哪个为准」与「这一刻按钮该不该停用」——
 * 这两件事判错的代价是真的执行了一次基于旧前提的操作。
 */
import { describe, expect, it } from 'vitest'
import { approvalGate, approvalRemaining } from './agent'

const now = 1_000_000

describe('确认的有效期', () => {
  it('没有期限就一直能拍板', () => {
    const gate = approvalGate({ now })
    expect(gate.state).toBe('open')
    expect(gate.decidable).toBe(true)
    expect(gate.remaining).toBeUndefined()
  })

  it('还早的时候不催：有剩余时间，但不显示', () => {
    const gate = approvalGate({ expiresAt: now + 300_000, now })
    expect(gate.state).toBe('open')
    expect(gate.detail).toBe('')
  })

  it('快到期时报出剩余秒数，但仍然允许拍板', () => {
    const gate = approvalGate({ expiresAt: now + 12_000, now })
    expect(gate.state).toBe('expiring')
    expect(gate.decidable).toBe(true)
    expect(gate.detail).toBe('还有 12 秒')
  })

  it('过期之后停用，并给出重新发起的出口', () => {
    const gate = approvalGate({ expiresAt: now - 1, now })
    expect(gate.state).toBe('expired')
    expect(gate.decidable).toBe(false)
    expect(gate.action).toBe('renew')
  })

  it('版本变了就停用，出口是先看新版本而不是重发', () => {
    const gate = approvalGate({ now, version: 2, currentVersion: 3 })
    expect(gate.state).toBe('stale')
    expect(gate.decidable).toBe(false)
    expect(gate.action).toBe('review')
    expect(gate.detail).toContain('第 2 版')
    expect(gate.detail).toContain('第 3 版')
  })

  it('版本没变就不算失效——只给了版本号不该把卡片停掉', () => {
    expect(approvalGate({ now, version: 2, currentVersion: 2 }).state).toBe('open')
    expect(approvalGate({ now, version: 2 }).state).toBe('open')
  })

  it('过期与版本失效同时成立时以版本失效为准', () => {
    const gate = approvalGate({ expiresAt: now - 1, now, version: 1, currentVersion: 4 })
    // 给一条针对旧版本的确认续期，等于把「内容变了」悄悄抹掉
    expect(gate.state).toBe('stale')
    expect(gate.action).toBe('review')
  })

  it('每一态都有文字标签——颜色不能是唯一线索', () => {
    const gates = [
      approvalGate({ now }),
      approvalGate({ expiresAt: now + 12_000, now }),
      approvalGate({ expiresAt: now - 1, now }),
      approvalGate({ now, version: 1, currentVersion: 2 })
    ]
    for (const gate of gates) expect(gate.label.length).toBeGreaterThan(0)
  })
})

describe('剩余秒数', () => {
  it('向上取整：显示 10 秒时真实剩余不超过 10 秒', () => {
    expect(approvalRemaining(now + 9001, now)).toBe(10)
    expect(approvalRemaining(now + 10_000, now)).toBe(10)
  })

  it('过了时刻就是 0，不给负数', () => {
    expect(approvalRemaining(now - 8000, now)).toBe(0)
  })
})
