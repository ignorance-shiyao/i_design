/**
 * 故障注入：喂给判据一组「坏掉的事实」，确认它会红。
 *
 * 这条检查的判据是纯函数，坏法只有一种：把判据本身写松（「不变」写成「变了也行」）。
 * 那种错在全绿的仓库里永远暴露不出来——观察到的事实一直是好的，
 * 判据松没松根本看不出来。所以这里不驱动浏览器，只喂事实。
 *
 * 每一条都成对：坏的事实要报出来，好的事实不许报。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { judgeBoard, judgeTable, judgeThread } from './check-keyboard-paths.mjs'

const goodTable = {
  ariaSortBefore: 'none',
  ariaSortAfter: 'ascending',
  orderBefore: ['甲', '乙'],
  orderAfter: ['乙', '甲'],
  selectedBeforeCollapse: 2,
  selectedAfterCollapse: 2
}

test('表格：一切正常时不报', () => {
  assert.deepEqual(judgeTable(goodTable), [])
})

test('表格：排序了但 aria-sort 没跟着变——读屏器读不出升降，必须报', () => {
  const problems = judgeTable({ ...goodTable, ariaSortBefore: 'none', ariaSortAfter: 'none' })
  assert.equal(problems.length, 2, JSON.stringify(problems))
  assert.match(problems.join(), /aria-sort/)
})

test('表格：按下去行序没变——排序压根没生效，必须报', () => {
  const problems = judgeTable({ ...goodTable, orderAfter: ['甲', '乙'] })
  assert.match(problems.join(), /排序压根没生效/)
})

test('表格：收起分组把选择弄丢了——必须报', () => {
  const problems = judgeTable({ ...goodTable, selectedAfterCollapse: 0 })
  assert.match(problems.join(), /收起分组把选择弄丢/)
})

const goodBoard = {
  byKeyboard: '沈黎 / 待办',
  byMenu: '沈黎 / 待办',
  blockedReasons: ['「进行中」在制品已满（2/2）']
}

test('看板：两条路径落到同一格时不报', () => {
  assert.deepEqual(judgeBoard(goodBoard), [])
})

test('看板：键盘与菜单落点不同——必须报', () => {
  assert.match(judgeBoard({ ...goodBoard, byMenu: '林岚 / 待办' }).join(), /两条路径不一致/)
})

test('看板：落不下的格子一条理由都没有——必须报', () => {
  assert.match(judgeBoard({ ...goodBoard, blockedReasons: [] }).join(), /没有任何落不下的格子写出理由/)
})

const goodThread = {
  rowsBeforeRetry: 8,
  rowsAfterRetry: 8,
  failedBeforeRetry: 1,
  failedAfterRetry: 0,
  dividerBeforeNew: '那按 8 万走',
  dividerAfterNew: '那按 8 万走',
  unreadBeforeNew: 5,
  unreadAfterNew: 6
}

test('线程：一切正常时不报', () => {
  assert.deepEqual(judgeThread(goodThread), [])
})

test('线程：重试又发出一条——必须报', () => {
  assert.match(judgeThread({ ...goodThread, rowsAfterRetry: 9 }).join(), /不是原地更新/)
})

test('线程：点了重试失败标记还在——必须报', () => {
  assert.match(judgeThread({ ...goodThread, failedAfterRetry: 1 }).join(), /重试没有生效/)
})

test('线程：新消息把未读分隔线推走了——必须报', () => {
  assert.match(
    judgeThread({ ...goodThread, dividerAfterNew: '我这边也同步' }).join(),
    /把未读分隔线推走/
  )
})

test('线程：新消息进来但未读计数没涨——必须报', () => {
  assert.match(judgeThread({ ...goodThread, unreadAfterNew: 5 }).join(), /未读计数没涨/)
})
