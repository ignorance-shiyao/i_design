/**
 * 故障注入：喂给判据一组坏掉的测量值，确认它会红。
 *
 * 这条检查的判据是纯函数，坏法有两种，两种都不会自己暴露：
 *
 * 一是**判据写松**——预算调到虚拟化没了也过得去。
 * 二是**检查空跑**——选择器过期之后一个节点都匹配不到，`0 <= 预算` 永远成立，
 *    于是它一直是绿的，而它其实什么也没在看。写这条检查时我自己就先踩了第二种：
 *    虚拟列表的类名猜错，测出来 0 个节点，兜底那条当场把我拦住了。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { BUDGETS, judge } from './check-perf.mjs'

const good = [
  { name: '两万行表格', rendered: 44, elements: 1224 },
  { name: '两万项虚拟列表', rendered: 11, elements: 573 },
  { name: '一万项下拉', rendered: 51, elements: 728 }
]

test('都在预算内时不报', () => {
  assert.deepEqual(judge(good), [])
})

test('虚拟化没了——两万行真铺出来，必须报', () => {
  const problems = judge([{ ...good[0], rendered: 20000 }, ...good.slice(1)])
  assert.equal(problems.length, 1, JSON.stringify(problems))
  assert.match(problems[0], /渲染出了 20000 个节点/)
  // 报的时候要带上「为什么是这个预算」，否则下一个人只会把预算调高
  assert.match(problems[0], /虚拟化/)
})

test('一个节点都没渲染出来——检查在空跑，必须报', () => {
  const problems = judge([{ ...good[0], rendered: 0 }, ...good.slice(1)])
  assert.match(problems.join(), /正在空跑/)
})

test('整页元素爆掉——必须报', () => {
  const problems = judge([{ ...good[0], elements: 99999 }, ...good.slice(1)])
  assert.match(problems.join(), /整页 99999 个元素/)
})

test('预算留了余量，不是贴着实测值定的', () => {
  // 贴着定的话，任何一次正常的版面调整都会踩线，预算就会被一路调高直到失去意义
  for (const budget of BUDGETS) {
    const observed = good.find((m) => m.name === budget.name)
    assert.ok(
      budget.max >= observed.rendered * 2,
      `${budget.name} 的预算 ${budget.max} 离实测 ${observed.rendered} 太近`
    )
    // 但也不能松到虚拟化没了还过得去
    assert.ok(budget.max < budget.total / 10, `${budget.name} 的预算松到拦不住虚拟化消失`)
  }
})
