/**
 * 表单壳的回归测试。
 *
 * 测的全是「该不该拦住用户」这类决定——判错的代价要么是发出两笔订单，
 * 要么是把人刚填的二十个字段清空。
 */
import { describe, expect, it } from 'vitest'
import {
  changedFields,
  isDirty,
  leaveGuard,
  resetLabel,
  resetValues,
  stepOfError,
  stepState,
  submitGate
} from './formhost'

describe('提交闸门', () => {
  it('正在提交时拦住第二次点击——这一档就是重复提交的闸', () => {
    const gate = submitGate({ phase: 'submitting', valid: true })
    expect(gate.allowed).toBe(false)
    expect(gate.busy).toBe(true)
  })

  it('正在提交时说的是「正在提交」，不是「表单有错」', () => {
    // 说成表单有错，用户会回头去逐个字段找一个并不存在的错
    expect(submitGate({ phase: 'submitting', valid: false }).reason).toBe('正在提交，请稍候')
  })

  it('提交失败之后允许再来一次', () => {
    expect(submitGate({ phase: 'failed', valid: true }).allowed).toBe(true)
  })

  it('提交成功之后默认不再允许，除非显式说明可以重复提交', () => {
    expect(submitGate({ phase: 'succeeded', valid: true }).allowed).toBe(false)
    expect(submitGate({ phase: 'succeeded', valid: true, resubmittable: true }).allowed).toBe(true)
  })

  it('外部禁用压过一切', () => {
    expect(submitGate({ phase: 'idle', valid: true, disabled: true }).allowed).toBe(false)
  })
})

describe('改没改过', () => {
  it('改了又改回去就是没改过——这时候拦住他是纯粹的骚扰', () => {
    expect(isDirty({ a: 1 }, { a: 1 })).toBe(false)
    expect(changedFields({ a: 1, b: 'x' }, { a: 2, b: 'x' })).toEqual(['a'])
  })

  it('新增与删除的键都算改过', () => {
    expect(changedFields({ a: 1 }, { a: 1, b: 2 })).toEqual(['b'])
    expect(changedFields({ a: 1, b: 2 }, { a: 1 })).toEqual(['b'])
  })

  it('数组与对象按内容比，不按引用', () => {
    expect(isDirty({ tags: ['x'] }, { tags: ['x'] })).toBe(false)
    expect(isDirty({ tags: ['x'] }, { tags: ['y'] })).toBe(true)
  })
})

describe('离开保护', () => {
  it('没改过不拦：拦了会让「点错了想退出去」变成一次多余的确认', () => {
    expect(leaveGuard({ base: { a: 1 }, current: { a: 1 }, phase: 'idle' }).blocked).toBe(false)
  })

  it('改过就拦，并说清有几项没保存', () => {
    const guard = leaveGuard({ base: { a: 1, b: 1 }, current: { a: 2, b: 3 }, phase: 'idle' })
    expect(guard.blocked).toBe(true)
    expect(guard.message).toContain('2 项')
  })

  it('正在提交与已提交成功都不拦', () => {
    const base = { a: 1 }
    const current = { a: 2 }
    expect(leaveGuard({ base, current, phase: 'submitting' }).blocked).toBe(false)
    expect(leaveGuard({ base, current, phase: 'succeeded' }).blocked).toBe(false)
  })

  it('存过草稿就不拦：东西没丢，拦住只会让人以为出了事', () => {
    const guard = leaveGuard({ base: { a: 1 }, current: { a: 2 }, phase: 'idle', draftSaved: true })
    expect(guard.blocked).toBe(false)
  })
})

describe('重置范围', () => {
  const initial = { a: 1, b: 2 }
  const draft = { a: 9 }

  it('默认回到打开时的样子，而不是清空', () => {
    expect(resetValues('initial', initial, draft)).toEqual(initial)
  })

  it('清空是单独一档，得明说', () => {
    expect(resetValues('empty', initial, draft)).toEqual({})
  })

  it('要回到草稿却没有草稿时退回初始值，而不是清空', () => {
    // 「没有草稿」不是「用户想清空」的理由
    expect(resetValues('draft', initial, undefined)).toEqual(initial)
    expect(resetValues('draft', initial, draft)).toEqual(draft)
  })

  it('按钮文案跟着范围走——含糊的「重置」正是最危险的那一种', () => {
    expect(resetLabel('empty')).toBe('清空')
    expect(resetLabel('initial')).toBe('撤销修改')
    expect(resetLabel('draft', true)).toBe('回到草稿')
    expect(resetLabel('draft', false)).toBe('撤销修改')
  })
})

describe('分步', () => {
  const steps = [
    { key: 's1', title: '基本信息', fields: ['name', 'code'] },
    { key: 's2', title: '收货地址', fields: ['addr'] },
    { key: 's3', title: '备注', fields: ['note'], optional: true }
  ]

  it('只用这一步自己的字段判断能不能往下走', () => {
    // 拿整张表的错误去拦，会出现第一步填得好好的却点不动下一步
    const state = stepState({ steps, index: 0, errorPaths: ['addr'], visited: [0] })
    expect(state.blocked).toBe(false)
    expect(state.canNext).toBe(true)
  })

  it('这一步自己有错就拦住下一步', () => {
    const state = stepState({ steps, index: 0, errorPaths: ['name'], visited: [0] })
    expect(state.blocked).toBe(true)
    expect(state.canNext).toBe(false)
  })

  it('可跳过的步骤不拦', () => {
    const state = stepState({ steps, index: 2, errorPaths: ['note'], visited: [0, 1, 2] })
    expect(state.blocked).toBe(false)
  })

  it('没走到过的步骤不标红：那说的是「还没填」，不是「填错了」', () => {
    const state = stepState({ steps, index: 0, errorPaths: ['addr'], visited: [0] })
    expect(state.marks.map((m) => m.state)).toEqual(['current', 'todo', 'todo'])
  })

  it('走过又有错的步骤标红，走过没错的标完成', () => {
    const state = stepState({ steps, index: 2, errorPaths: ['addr'], visited: [0, 1, 2] })
    expect(state.marks.map((m) => m.state)).toEqual(['done', 'error', 'current'])
  })

  it('第一步没有上一步，最后一步没有下一步', () => {
    expect(stepState({ steps, index: 0, errorPaths: [], visited: [0] }).canPrev).toBe(false)
    const last = stepState({ steps, index: 2, errorPaths: [], visited: [0, 1, 2] })
    expect(last.isLast).toBe(true)
    expect(last.canNext).toBe(false)
  })

  it('提交失败时能算出该跳回哪一步', () => {
    // 错的字段在第一步而用户站在第三步，不跳回去他只会反复点提交
    expect(stepOfError(steps, ['name'])).toBe(0)
    expect(stepOfError(steps, ['addr'])).toBe(1)
    // 表单级错误不属于任何一步，原地显示即可
    expect(stepOfError(steps, ['__form'])).toBe(-1)
  })
})
