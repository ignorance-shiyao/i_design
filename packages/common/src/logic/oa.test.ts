import { describe, expect, it } from 'vitest'
import { applyOa, emptyOa, markOaRead, oaAmountCents, oaGate, type OaActor, type OaFields } from './oa'
const owner: OaActor = { id: 'owner', canApply: true, canReview: true }
const reviewer: OaActor = { id: 'reviewer', canApply: true, canReview: true }
const fields: OaFields = { title: '差旅报销', amount: 120050, reason: '客户现场调研', reviewerId: reviewer.id }
const submitted = () => applyOa(emptyOa(), owner, { action: 'submit', key: 'new', fields }, 1)
describe('OA 事务', () => {
  it('提交、退回、重提、通过，通知与历史一起落库且保留单号', () => {
    const first = submitted()
    const returned = applyOa(first.state, reviewer, { action: 'return', key: 'return', id: first.id, revision: 1, note: '补充行程' }, 2)
    const again = applyOa(returned.state, owner, { action: 'resubmit', key: 'again', id: first.id, revision: 2, fields: { ...fields, reason: '行程已补充' } }, 3)
    const last = applyOa(again.state, reviewer, { action: 'approve', key: 'approve', id: first.id, revision: 3 }, 4)
    expect(last.state.requests).toHaveLength(1)
    expect(last.state.requests[0]).toMatchObject({ id: first.id, status: 'approved', revision: 4, reason: '行程已补充' })
    expect(last.state.requests[0].history.map(h => h.action)).toEqual(['submit', 'return', 'resubmit', 'approve'])
    expect(last.state.notices.map(n => n.recipientId)).toEqual(['reviewer', 'owner', 'reviewer', 'owner'])
    expect(first.state.requests[0].status).toBe('pending')
  })
  it('重复提交只写一张单和一条通知，同键不同内容报冲突', () => {
    const first = submitted()
    const second = applyOa(first.state, owner, { action: 'submit', key: 'new', fields }, 2)
    expect(second.state).toBe(first.state)
    expect(second.duplicate).toBe(true)
    expect(() => applyOa(first.state, owner, { action: 'submit', key: 'new', fields: { ...fields, amount: 3 } }, 2)).toThrow('不同内容')
  })
  it('越权和自审都由事务层拦截', () => {
    const first = submitted()
    for (const actor of [owner, { ...reviewer, canReview: false }, { ...reviewer, id: 'other' }]) {
      expect(() => applyOa(first.state, actor, { action: 'approve', key: 'x', id: first.id, revision: 1 }, 2)).toThrow()
    }
    expect(oaGate(first.state.requests[0], owner, 'approve')).toContain('自己')
  })
  it('退回无原因、过期版本都失败且不新增通知', () => {
    const first = submitted()
    expect(() => applyOa(first.state, reviewer, { action: 'return', key: 'x', id: first.id, revision: 1 }, 2)).toThrow('修改原因')
    expect(() => applyOa(first.state, reviewer, { action: 'approve', key: 'y', id: first.id, revision: 0 }, 2)).toThrow('版本')
    expect(first.state.notices).toHaveLength(1)
  })
  it('状态与角色矩阵：待审批只给审批人，退回只给申请人，终态不可写', () => {
    const base = submitted().state.requests[0]
    for (const status of ['pending', 'returned', 'approved'] as const) {
      for (const actor of [owner, reviewer, { id: 'observer', canApply: false, canReview: false }]) {
        for (const action of ['approve', 'return', 'resubmit'] as const) {
          const allowed = (status === 'pending' && actor.id === reviewer.id && action !== 'resubmit') || (status === 'returned' && actor.id === owner.id && action === 'resubmit')
          expect(oaGate({ ...base, status }, actor, action) === '').toBe(allowed)
        }
      }
    }
  })
  it('非法金额、标题和自审配置都不创建申请', () => {
    for (const invalid of [{ amount: 0 }, { amount: NaN }, { amount: 1.1 }, { title: '' }, { reason: '' }, { reviewerId: owner.id }]) {
      expect(() => applyOa(emptyOa(), owner, { action: 'submit', key: 'x', fields: { ...fields, ...invalid } }, 1)).toThrow()
    }
    expect(() => applyOa(emptyOa(), { ...owner, canApply: false }, { action: 'submit', key: 'x', fields }, 1)).toThrow('权限')
  })
  it('已读只改本人的通知', () => {
    const first = submitted().state
    expect(markOaRead(first, owner.id, [first.notices[0].id]).notices[0].seen).toBe(false)
    expect(markOaRead(first, reviewer.id, [first.notices[0].id]).notices[0].seen).toBe(true)
  })
  it('重提字段不能夹带单号、申请人或历史覆盖事务身份', () => {
    const first = submitted()
    const returned = applyOa(first.state, reviewer, { action: 'return', key: 'r', id: first.id, revision: 1, note: '补充说明' }, 2)
    const injected = { ...fields, id: 'forged', ownerId: reviewer.id, history: [] }
    const next = applyOa(returned.state, owner, { action: 'resubmit', key: 's', id: first.id, revision: 2, fields: injected }, 3)
    expect(next.state.requests[0]).toMatchObject({ id: first.id, ownerId: owner.id })
    expect(next.state.requests[0].history).toHaveLength(3)
  })
  it('金额按十进制转分，拒绝科学计数法、负数与三位小数', () => {
    expect(oaAmountCents('1200.50')).toBe(120050)
    expect(oaAmountCents('0.29')).toBe(29)
    for (const v of ['-1', '1e3', '1.234', '']) expect(oaAmountCents(v)).toBeNaN()
  })
})
