/**
 * 详情页逻辑的回归测试。
 *
 * 测的全是「该不该出现」「为什么是灰的」「回哪儿去」——
 * 判错的代价是用户对着一个灰按钮反复试，或者返回时把翻了七页的筛选全丢掉。
 */
import { describe, expect, it } from 'vitest'
import {
  detailActions,
  detailNeighbours,
  noActionHint,
  packReturn,
  recordFreshness,
  returnLabel,
  unpackReturn
} from './detail'

const specs = [
  { key: 'edit', label: '编辑', states: ['draft'] },
  { key: 'submit', label: '提交', kind: 'primary' as const, states: ['draft'] },
  { key: 'approve', label: '通过', states: ['submitted'], permission: '审批' },
  { key: 'print', label: '打印', readonly: true },
  { key: 'void', label: '作废', kind: 'danger' as const, states: ['submitted'], permission: '作废' }
]

describe('这条记录现在能做什么', () => {
  it('状态不允许的动作不出现，而不是灰着', () => {
    // 灰着摆在那儿只会让人反复去试、去猜要满足什么条件
    const actions = detailActions(specs, { status: 'draft', permissions: ['审批'] })
    expect(actions.map((a) => a.key)).toEqual(['edit', 'submit', 'print'])
  })

  it('没权限的动作出现但停用，并说清是权限问题', () => {
    // 藏起来的话用户会以为功能不存在，转头去提工单
    const actions = detailActions(specs, { status: 'submitted', permissions: [] })
    const approve = actions.find((a) => a.key === 'approve')!
    expect(approve.disabled).toBe(true)
    expect(approve.reason).toContain('审批')
    expect(approve.reason).toContain('权限')
  })

  it('记录失效时写动作停掉，只读动作照常可用', () => {
    // 把「打印」一起停掉，只会让用户以为整页坏了
    const actions = detailActions(specs, {
      status: 'draft',
      permissions: [],
      freshness: 'stale'
    })
    expect(actions.find((a) => a.key === 'edit')!.disabled).toBe(true)
    expect(actions.find((a) => a.key === 'print')!.disabled).toBe(false)
  })

  it('记录被删时的原因与被改时不是同一句', () => {
    const removed = detailActions(specs, { status: 'draft', freshness: 'deleted' })
    const changed = detailActions(specs, { status: 'draft', freshness: 'stale' })
    expect(removed[0].reason).toContain('已被删除')
    expect(changed[0].reason).toContain('刷新')
  })

  it('业务规则挡下的动作用它自己那句话', () => {
    const actions = detailActions(specs, {
      status: 'submitted',
      permissions: ['审批'],
      denied: { approve: '不能审批自己提交的单据' }
    })
    expect(actions.find((a) => a.key === 'approve')!.reason).toBe('不能审批自己提交的单据')
  })

  it('权限压过失效压过业务规则——先说那条刷新一百次也不会变的', () => {
    const actions = detailActions(specs, {
      status: 'submitted',
      permissions: [],
      freshness: 'stale',
      denied: { approve: '不能审批自己提交的单据' }
    })
    expect(actions.find((a) => a.key === 'approve')!.reason).toContain('权限')
  })

  it('停用了就一定有原因，没有例外', () => {
    const actions = detailActions(specs, {
      status: 'submitted',
      permissions: [],
      freshness: 'stale',
      denied: { void: '这张单已开票' }
    })
    for (const action of actions) {
      if (action.disabled) expect(action.reason.length).toBeGreaterThan(0)
    }
  })

  it('一个动作都没有时有一句话说明，而不是空白一片', () => {
    expect(noActionHint('已发货')).toContain('已发货')
  })
})

describe('看到的这一份还作不作数', () => {
  it('版本一致就是最新，不说话', () => {
    const state = recordFreshness({ seenRevision: 3, currentRevision: 3 })
    expect(state.kind).toBe('fresh')
    expect(state.action).toBe('none')
  })

  it('被改过时把两个版本号都摆出来——只说「操作失败」等于让人再点一次', () => {
    const state = recordFreshness({ seenRevision: 3, currentRevision: 5 })
    expect(state.kind).toBe('stale')
    expect(state.detail).toContain('v3')
    expect(state.detail).toContain('v5')
    expect(state.action).toBe('refresh')
  })

  it('被删掉时出口是回列表，不是刷新——刷新只会再看到一次「不存在」', () => {
    const state = recordFreshness({ seenRevision: 3, currentRevision: 3, exists: false })
    expect(state.kind).toBe('deleted')
    expect(state.action).toBe('back')
  })

  it('被删压过被改：记录都没了，版本号比不比较已经没意义', () => {
    expect(recordFreshness({ seenRevision: 1, currentRevision: 9, exists: false }).kind).toBe('deleted')
  })
})

describe('上一条 / 下一条', () => {
  const ids = ['a', 'b', 'c']

  it('给出位置文案与两头的 id', () => {
    const n = detailNeighbours(ids, 'b')
    expect(n.position).toBe('第 2 条，共 3 条')
    expect(n.prevId).toBe('a')
    expect(n.nextId).toBe('c')
    expect(n.edgeHint).toBe('')
  })

  it('到头了说清楚，而不是把按钮藏掉', () => {
    expect(detailNeighbours(ids, 'a').edgeHint).toBe('已经是第一条')
    expect(detailNeighbours(ids, 'c').edgeHint).toBe('已经是最后一条')
    expect(detailNeighbours(['a'], 'a').edgeHint).toBe('只有这一条')
  })

  it('不在这批里时不硬凑一个位置出来', () => {
    const n = detailNeighbours(ids, 'zz')
    expect(n.index).toBe(-1)
    expect(n.position).toBe('')
    expect(n.prevId).toBeNull()
  })
})

describe('从哪儿来，回哪儿去', () => {
  it('打包再解开是同一张票', () => {
    const ticket = { search: '?owner=林岚&status=archived&page=6', scrollY: 1280, focusId: 'SO-7' }
    expect(unpackReturn(packReturn(ticket))).toEqual(ticket)
  })

  it('滚动位置取整：小数在不同缩放下还原不回同一位置', () => {
    expect(unpackReturn(packReturn({ search: '', scrollY: 12.6 }))!.scrollY).toBe(13)
  })

  it('负的滚动位置归零', () => {
    expect(unpackReturn(packReturn({ search: '', scrollY: -40 }))!.scrollY).toBe(0)
  })

  it('查询串里带 & 也不会被劈开——自己拼分隔符迟早要栽在这儿', () => {
    const search = '?q=' + encodeURIComponent('A&B') + '&tag=x'
    expect(unpackReturn(packReturn({ search, scrollY: 0 }))!.search).toBe(search)
  })

  it('坏票据返回 null 而不是抛错：它来自 URL，用户会手改会截断', () => {
    expect(unpackReturn('{不是 JSON')).toBeNull()
    expect(unpackReturn('')).toBeNull()
    expect(unpackReturn(null)).toBeNull()
    expect(unpackReturn('123')).toBeNull()
  })

  it('缺字段的票据补默认值，不整张作废', () => {
    const ticket = unpackReturn('{"s":"?a=1"}')
    expect(ticket).toEqual({ search: '?a=1', scrollY: 0, focusId: undefined })
  })

  it('返回按钮带上页码比光写「返回」有用', () => {
    expect(returnLabel({ search: '?page=6', scrollY: 0 })).toBe('返回列表第 7 页')
    expect(returnLabel({ search: '?owner=x', scrollY: 0 })).toBe('返回列表')
    expect(returnLabel(null)).toBe('返回列表')
  })
})
