/**
 * 运行状态叙述的回归测试。
 *
 * 测的全是「两种状态同时成立时该说哪一个」和「取消按钮这一刻灰不灰」——
 * 这两件事一旦各端各判一遍就会出现同一个运行在网页上能取消、在小程序里不能。
 */
import { describe, expect, it } from 'vitest'
import { describeRun, retryCountdown } from './lifecycle'

const at = 1_000_000

describe('运行状态的叙述', () => {
  it('排队要说出前面还有几个——否则等待没有尽头', () => {
    const notice = describeRun({ status: 'queued', queuePosition: 3, now: at })
    expect(notice.label).toBe('排队中')
    expect(notice.detail).toBe('前面还有 3 个请求')
    expect(notice.busy).toBe(true)
    expect(notice.cancelable).toBe(true)
  })

  it('轮到自己了但还没连上，说「马上就轮到了」，不说「前面还有 0 个」', () => {
    expect(describeRun({ status: 'queued', queuePosition: 0, now: at }).detail).toBe('马上就轮到了')
  })

  it('服务端没给队列信息时不编一个出来', () => {
    expect(describeRun({ status: 'queued', now: at }).detail).toBe('')
  })

  it('排队与连接是两态，不是同一个转圈', () => {
    const queued = describeRun({ status: 'queued', now: at })
    const connecting = describeRun({ status: 'connecting', now: at })
    expect(queued.icon).not.toBe(connecting.icon)
    expect(queued.label).not.toBe(connecting.label)
  })

  it('断线压过「生成中」：运行状态还是 streaming，但要说的是连接断了', () => {
    const notice = describeRun({
      status: 'streaming',
      connection: 'reconnecting',
      attempt: 2,
      retryAt: at + 2400,
      now: at
    })
    expect(notice.label).toBe('连接断开')
    expect(notice.detail).toBe('第 2 次重连，3 秒后重试')
    expect(notice.tone).toBe('danger')
    // 会自己再试，所以仍然要转圈；也仍然允许取消
    expect(notice.busy).toBe(true)
    expect(notice.cancelable).toBe(true)
  })

  it('终态压过断线：跑完的运行不该因为连接没关干净而显示「重连中」', () => {
    const notice = describeRun({ status: 'completed', connection: 'reconnecting', now: at })
    expect(notice.label).toBe('已完成')
    expect(notice.busy).toBe(false)
    expect(notice.cancelable).toBe(false)
  })

  it('等人确认不转圈——转圈会让人以为再等等就好了', () => {
    const notice = describeRun({ status: 'awaiting-approval', now: at })
    expect(notice.busy).toBe(false)
    expect(notice.cancelable).toBe(true)
  })

  it('三个终态都不能取消', () => {
    for (const status of ['completed', 'failed', 'cancelled'] as const) {
      expect(describeRun({ status, now: at }).cancelable).toBe(false)
    }
  })

  it('每一态都有文字标签——颜色不能是唯一线索', () => {
    const states = [
      { status: 'queued' as const },
      { status: 'connecting' as const },
      { status: 'streaming' as const },
      { status: 'awaiting-approval' as const },
      { status: 'completed' as const },
      { status: 'failed' as const },
      { status: 'cancelled' as const }
    ]
    for (const state of states) {
      expect(describeRun({ ...state, now: at }).label.length).toBeGreaterThan(0)
    }
  })

  it('已等多久从 startedAt 算，没给就是 0', () => {
    expect(describeRun({ status: 'queued', startedAt: at - 4200, now: at }).waited).toBe(4200)
    expect(describeRun({ status: 'queued', now: at }).waited).toBe(0)
  })
})

describe('重试倒计时', () => {
  it('向上取整：显示 3 秒时真实剩余不超过 3 秒', () => {
    expect(retryCountdown(at + 2001, at)).toBe(3)
    expect(retryCountdown(at + 3000, at)).toBe(3)
  })

  it('过了时刻就是 0，不给负数', () => {
    expect(retryCountdown(at - 5000, at)).toBe(0)
  })
})
