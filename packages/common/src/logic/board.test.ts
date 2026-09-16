import { describe, expect, it } from 'vitest'
import {
  columnStat,
  countIn,
  describeMove,
  dropTargets,
  moveCard,
  moveCheck,
  moveMenu,
  nextDropTarget,
  type BoardCard,
  type BoardColumn,
  type BoardLane
} from './board'

const columns: BoardColumn[] = [
  { id: 'todo', title: '待办' },
  { id: 'doing', title: '进行中', wipLimit: 2 },
  { id: 'done', title: '已完成', allowFrom: ['doing'] }
]
const lanes: BoardLane[] = [
  { id: 'lan', title: '林岚' },
  { id: 'shen', title: '沈黎' },
  { id: 'zhou', title: '周其', blockedReason: '周其已离职，不能再分派' }
]
const cards: BoardCard[] = [
  { id: 'k1', title: '对账单', columnId: 'todo', laneId: 'lan' },
  { id: 'k2', title: '合同附件', columnId: 'doing', laneId: 'lan' },
  { id: 'k3', title: '发货单', columnId: 'doing', laneId: 'lan' },
  { id: 'k4', title: '归档的那张', columnId: 'todo', laneId: 'shen', lockedReason: '已归档，不能再改' }
]

describe('能不能落，以及为什么', () => {
  it('在制品满了给的是数字与出路，不是一句「不允许」', () => {
    const check = moveCheck(cards[0], { columnId: 'doing', laneId: 'lan' }, columns, cards, lanes)
    expect(check.allowed).toBe(false)
    expect(check.reason).toBe('「进行中」在制品已满（2/2），先挪走一张')
  })

  it('状态流转不允许时说清是从哪儿到哪儿', () => {
    const check = moveCheck(cards[0], { columnId: 'done', laneId: 'lan' }, columns, cards, lanes)
    expect(check.reason).toBe('「待办」不能直接进「已完成」')
  })

  it('卡片自己锁着时，哪儿都去不了', () => {
    expect(moveCheck(cards[3], { columnId: 'doing', laneId: 'shen' }, columns, cards, lanes).reason).toBe(
      '已归档，不能再改'
    )
  })

  it('泳道不收新卡时说的是泳道的理由', () => {
    expect(moveCheck(cards[0], { columnId: 'todo', laneId: 'zhou' }, columns, cards, lanes).reason).toBe(
      '周其已离职，不能再分派'
    )
  })

  it('判定顺序固定：卡片锁着压过泳道，泳道压过流转，流转压过在制品', () => {
    // 这张卡锁着，同时目标泳道也不收、也超了在制品——理由必须是「锁着」那条
    expect(moveCheck(cards[3], { columnId: 'doing', laneId: 'zhou' }, columns, cards, lanes).reason).toBe(
      '已归档，不能再改'
    )
    // 泳道不收 + 在制品也满：给泳道那条
    expect(moveCheck(cards[0], { columnId: 'doing', laneId: 'zhou' }, columns, cards, lanes).reason).toBe(
      '周其已离职，不能再分派'
    )
  })

  it('原地不动永远允许：同格重排不该被在制品上限拦住', () => {
    expect(moveCheck(cards[1], { columnId: 'doing', laneId: 'lan' }, columns, cards, lanes).allowed).toBe(true)
  })

  it('进同一列的另一条泳道时，那条泳道自己的在制品才算数', () => {
    // 林岚的进行中有 2 张（满），沈黎的进行中是 0 张
    expect(countIn(cards, 'doing', 'lan')).toBe(2)
    expect(moveCheck(cards[0], { columnId: 'doing', laneId: 'shen' }, columns, cards, lanes).allowed).toBe(true)
  })
})

describe('拖动与菜单是同一份清单', () => {
  it('菜单里的可落项与拖动允许落的完全一致', () => {
    const drops = dropTargets(cards[0], columns, cards, lanes)
    const menu = moveMenu(cards[0], columns, cards, lanes)
    const allowedDrops = drops.filter((d) => d.allowed).map((d) => d.title)
    const allowedMenu = menu.filter((d) => d.allowed).map((d) => d.title)
    // 菜单少了当前所在那一格（移到自己这儿不是一个动作），其余逐项相同
    expect(allowedDrops).toContain('林岚 / 待办')
    expect(allowedMenu).not.toContain('林岚 / 待办')
    expect(allowedMenu).toEqual(allowedDrops.filter((t) => t !== '林岚 / 待办'))
  })

  it('不能落的照常列出来，带着理由', () => {
    const menu = moveMenu(cards[0], columns, cards, lanes)
    const blocked = menu.filter((m) => !m.allowed)
    expect(blocked.map((m) => m.title)).toContain('林岚 / 进行中')
    expect(blocked.every((m) => m.reason.length > 0)).toBe(true)
  })

  it('不分泳道时每列一个落点', () => {
    const flat = cards.map((c) => ({ ...c, laneId: undefined }))
    expect(dropTargets(flat[0], columns, flat).map((t) => t.title)).toEqual(['待办', '进行中', '已完成'])
  })
})

describe('移动本身', () => {
  it('拖动与菜单走同一个函数，结果一字不差', () => {
    const byDrag = moveCard(cards, 'k1', { columnId: 'doing', laneId: 'shen' }, columns, lanes)
    const byMenu = moveCard(cards, 'k1', { columnId: 'doing', laneId: 'shen' }, columns, lanes)
    expect(byDrag).toEqual(byMenu)
    expect(byDrag.ok).toBe(true)
  })

  it('跨泳道时说清同时改了负责人与状态', () => {
    const result = moveCard(cards, 'k1', { columnId: 'doing', laneId: 'shen' }, columns, lanes)
    expect(result.message).toBe('「对账单」转给了「沈黎」，并移到「进行中」（负责人与状态都变了）')
    const card = result.cards.find((c) => c.id === 'k1')!
    expect(card).toMatchObject({ columnId: 'doing', laneId: 'shen' })
  })

  it('只换列、只换人、原地重排各说各的', () => {
    expect(describeMove(cards[1], { columnId: 'done', laneId: 'lan' }, columns, lanes)).toBe(
      '「合同附件」移到了「已完成」'
    )
    expect(describeMove(cards[1], { columnId: 'doing', laneId: 'shen' }, columns, lanes)).toBe(
      '「合同附件」转给了「沈黎」'
    )
    expect(describeMove(cards[1], { columnId: 'doing', laneId: 'lan' }, columns, lanes)).toBe(
      '「合同附件」在本列内换了位置'
    )
  })

  it('不许落时原样返回，并给出那句理由', () => {
    const result = moveCard(cards, 'k1', { columnId: 'done', laneId: 'lan' }, columns, lanes)
    expect(result.ok).toBe(false)
    expect(result.message).toBe('「待办」不能直接进「已完成」')
    expect(result.cards).toEqual(cards)
  })

  it('同列内重排也走这里，因此锁着的卡在原列也拖不动', () => {
    const reordered = moveCard(cards, 'k3', { columnId: 'doing', laneId: 'lan' }, columns, lanes, 0)
    const inColumn = reordered.cards.filter((c) => c.columnId === 'doing').map((c) => c.id)
    expect(inColumn).toEqual(['k3', 'k2'])
    // k4 锁着：它在自己那一格里也重排不了，理由与跨列时是同一句
    const locked = moveCard(cards, 'k4', { columnId: 'todo', laneId: 'shen' }, columns, lanes, 0)
    expect(locked.ok).toBe(false)
    expect(locked.message).toBe('已归档，不能再改')
  })

  it('不给位置就放到末尾', () => {
    const result = moveCard(cards, 'k1', { columnId: 'todo', laneId: 'shen' }, columns, lanes)
    const inCell = result.cards.filter((c) => c.columnId === 'todo' && c.laneId === 'shen').map((c) => c.id)
    expect(inCell).toEqual(['k4', 'k1'])
  })

  it('卡已经不在了就说出来，不要静默失败', () => {
    expect(moveCard(cards, '不存在', { columnId: 'todo' }, columns, lanes).message).toBe('这张卡已经不在了')
  })
})

describe('键盘', () => {
  const targets = dropTargets(cards[0], columns, cards, lanes)

  it('方向键跳过不能落的格子', () => {
    // 林岚 / 待办（当前）→ 下一个可落的不是「林岚 / 进行中」（满），而是再往后
    const next = nextDropTarget(targets, { columnId: 'todo', laneId: 'lan' }, 1)
    expect(next!.title).not.toBe('林岚 / 进行中')
    expect(next!.allowed).toBe(true)
  })

  it('走到头就停在头上，不绕回', () => {
    const usable = targets.filter((t) => t.allowed)
    const last = usable[usable.length - 1]
    expect(nextDropTarget(targets, last, 1)!.title).toBe(last.title)
    expect(nextDropTarget(targets, usable[0], -1)!.title).toBe(usable[0].title)
  })

  it('一个都不能落时返回 null，由调用方说明而不是静悄悄不动', () => {
    expect(nextDropTarget(dropTargets(cards[3], columns, cards, lanes), { columnId: 'todo', laneId: 'shen' }, 1)).toBeNull()
  })
})

describe('列头计数', () => {
  it('有上限就写成 2/2，没有分母的话用户要等到拖不进去才知道有上限', () => {
    expect(columnStat(columns[1], cards, 'lan').text).toBe('2/2')
    expect(columnStat(columns[0], cards, 'lan').text).toBe('1')
  })

  it('超了只是不让新的再进，已经在里面的不赶出去', () => {
    const crowded = [...cards, { id: 'k5', title: '第三张', columnId: 'doing', laneId: 'lan' }]
    const stat = columnStat(columns[1], crowded, 'lan')
    expect(stat.over).toBe(true)
    expect(stat.count).toBe(3)
    expect(stat.text).toBe('3/2')
  })
})
