import { describe, expect, it } from 'vitest'
import {
  buildHierarchy,
  hierarchyPath,
  hierarchyView,
  restIdOf,
  type HierarchyInput
} from './hierarchy'

/** 一级 100，二级只报到 80——现实里最常见的那种数据 */
const gapped: HierarchyInput[] = [
  { id: 'cn', parentId: null, label: '国内', value: 100 },
  { id: 'cn-east', parentId: 'cn', label: '华东', value: 50 },
  { id: 'cn-north', parentId: 'cn', label: '华北', value: 30 }
]

const flat: HierarchyInput[] = [
  { id: 'a', parentId: null, label: 'A', value: null },
  { id: 'a1', parentId: 'a', label: 'A1', value: 30 },
  { id: 'a2', parentId: 'a', label: 'A2', value: 20 },
  { id: 'b', parentId: null, label: 'B', value: null },
  { id: 'b1', parentId: 'b', label: 'B1', value: 50 }
]

describe('层级汇总契约', () => {
  it('父级没自报值时由子级汇总而来', () => {
    const model = buildHierarchy(flat)
    const a = model.nodes.find((n) => n.id === 'a')!
    expect(a.value).toBe(50)
    expect(model.total).toBe(100)
  })

  it('父级多出来的那部分单列成「未细分」，不悄悄抹掉也不改父级的数', () => {
    const model = buildHierarchy(gapped, { unit: ' 万' })
    const cn = model.nodes.find((n) => n.id === 'cn')!
    const rest = model.nodes.find((n) => n.id === restIdOf('cn'))!
    expect(cn.value).toBe(100)
    expect(rest.kind).toBe('rest')
    expect(rest.value).toBe(20)
    // 能被选中、能被读出来，才算「看得见」
    expect(rest.description).toContain('未细分')
    expect(rest.valueText).toBe('20 万')
    expect(cn.childIds).toEqual(['cn-east', 'cn-north', restIdOf('cn')])
  })

  it('子级之和超过父级是矛盾，不是缺口——判无效并指名节点', () => {
    const model = buildHierarchy([
      { id: 'cn', parentId: null, label: '国内', value: 100 },
      { id: 'cn-east', parentId: 'cn', label: '华东', value: 70 },
      { id: 'cn-north', parentId: 'cn', label: '华北', value: 50 }
    ])
    expect(model.state).toBe('invalid')
    expect(model.caption).toContain('国内')
    expect(model.nodes).toHaveLength(0)
  })

  it('浮点零头不补出一个宽度为零、却能被 Tab 到的空节点', () => {
    const model = buildHierarchy([
      { id: 'r', parentId: null, label: '合计', value: 0.3 },
      { id: 'r1', parentId: 'r', label: '一', value: 0.1 },
      { id: 'r2', parentId: 'r', label: '二', value: 0.2 }
    ])
    expect(model.nodes.some((n) => n.kind === 'rest')).toBe(false)
  })

  it('两个分母各报各的：占全体与占上级不是一回事', () => {
    const model = buildHierarchy(flat)
    const a1 = model.nodes.find((n) => n.id === 'a1')!
    expect(a1.share).toBeCloseTo(0.3)
    expect(a1.shareOfParent).toBeCloseTo(0.6)
    expect(a1.description).toContain('占全体')
    expect(a1.description).toContain('占上级')
  })

  it('同层降序、相同值按输入次序，位置沿轴首尾相接不留缝', () => {
    const model = buildHierarchy([
      { id: 'r', parentId: null, label: '根', value: null },
      { id: 'x', parentId: 'r', label: '先来的', value: 10 },
      { id: 'y', parentId: 'r', label: '后来的', value: 10 },
      { id: 'z', parentId: 'r', label: '最大的', value: 30 }
    ])
    const kids = model.nodes.filter((n) => n.depth === 1)
    expect(kids.map((n) => n.id)).toEqual(['z', 'x', 'y'])
    expect(kids[0].start).toBeCloseTo(0)
    expect(kids[0].end).toBeCloseTo(kids[1].start)
    expect(kids[1].end).toBeCloseTo(kids[2].start)
    expect(kids[2].end).toBeCloseTo(1)
  })

  it('负值与非有限数不进分母，但留在排除清单里说得出原因', () => {
    const model = buildHierarchy([
      { id: 'r', parentId: null, label: '根', value: null },
      { id: 'ok', parentId: 'r', label: '正常', value: 10 },
      { id: 'neg', parentId: 'r', label: '负的', value: -5 },
      { id: 'nan', parentId: 'r', label: '坏的', value: Number.NaN }
    ])
    expect(model.total).toBe(10)
    expect(model.excluded.map((e) => e.id)).toEqual(['neg', 'nan'])
    expect(model.excluded[0].reason).toContain('负值')
    expect(model.caption).toContain('未计入')
  })

  it('被排除的节点带着整条子树一起走，并逐个记下原因', () => {
    const model = buildHierarchy([
      { id: 'r', parentId: null, label: '根', value: null },
      { id: 'bad', parentId: 'r', label: '坏枝', value: -1 },
      { id: 'kid', parentId: 'bad', label: '坏枝的孩子', value: 100 },
      // 孙子这一层单独列出来：只砍一层的实现在直接子级上看不出破绽
      { id: 'grandkid', parentId: 'kid', label: '坏枝的孙子', value: 40 }
    ])
    expect(model.excluded.map((e) => e.id).sort()).toEqual(['bad', 'grandkid', 'kid'])
    expect(model.excluded.find((e) => e.id === 'grandkid')!.reason).toContain('坏枝')
    expect(model.nodes.some((n) => n.id === 'kid' || n.id === 'grandkid')).toBe(false)

    // 同一棵树，输入里孩子排在父级前面：排除必须与行序无关
    const reversed = buildHierarchy([
      { id: 'grandkid', parentId: 'kid', label: '坏枝的孙子', value: 40 },
      { id: 'kid', parentId: 'bad', label: '坏枝的孩子', value: 100 },
      { id: 'bad', parentId: 'r', label: '坏枝', value: -1 },
      { id: 'r', parentId: null, label: '根', value: null }
    ])
    expect(reversed.excluded.map((e) => e.id).sort()).toEqual(['bad', 'grandkid', 'kid'])
  })

  it('空 ID、重复 ID、不存在的父级、成环都判无效，各说各的原因', () => {
    expect(buildHierarchy([{ id: '', parentId: null, label: '', value: 1 }]).caption).toContain('不能为空')
    expect(
      buildHierarchy([
        { id: 'a', parentId: null, label: 'A', value: 1 },
        { id: 'a', parentId: null, label: '又一个 A', value: 1 }
      ]).caption
    ).toContain('重复')
    expect(
      buildHierarchy([{ id: 'a', parentId: 'nowhere', label: 'A', value: 1 }]).caption
    ).toContain('不存在')
    // 环：谁也不是根
    expect(
      buildHierarchy([
        { id: 'a', parentId: 'b', label: 'A', value: 1 },
        { id: 'b', parentId: 'a', label: 'B', value: 1 }
      ]).state
    ).toBe('invalid')
    // 环挂在一棵正常的树旁边：有根，但那两个节点永远走不到根
    const mixed = buildHierarchy([
      { id: 'root', parentId: null, label: '根', value: 1 },
      { id: 'a', parentId: 'b', label: 'A', value: 1 },
      { id: 'b', parentId: 'a', label: 'B', value: 1 }
    ])
    expect(mixed.state).toBe('invalid')
    expect(mixed.caption).toContain('成环')
  })

  it('保留后缀不许被业务 ID 占用，否则「未细分」会和真实节点撞号', () => {
    expect(buildHierarchy([{ id: restIdOf('x'), parentId: null, label: '假的', value: 1 }]).state).toBe(
      'invalid'
    )
  })

  it('空数据不遗留旧行；全零时占比无定义而不是 0%', () => {
    expect(buildHierarchy([]).state).toBe('empty')
    const zero = buildHierarchy([{ id: 'a', parentId: null, label: 'A', value: 0 }])
    expect(zero.state).toBe('ready')
    expect(zero.nodes[0].share).toBeNull()
    expect(zero.caption).toContain('无定义')
  })

  it('不修改入参', () => {
    const input = structuredClone(gapped)
    buildHierarchy(input)
    expect(input).toEqual(gapped)
  })

  it('回根路径给的是面包屑那条路，含它自己', () => {
    const model = buildHierarchy(flat)
    expect(hierarchyPath(model, 'a1').map((n) => n.id)).toEqual(['a', 'a1'])
  })

  it('下钻把焦点那一支摊满整条轴，占比仍按原来的分母报', () => {
    const model = buildHierarchy(flat)
    const view = hierarchyView(model, 'a')
    const a = view.find((n) => n.id === 'a')!
    const a1 = view.find((n) => n.id === 'a1')!
    expect(a.start).toBeCloseTo(0)
    expect(a.end).toBeCloseTo(1)
    expect(a.depth).toBe(0)
    expect(a1.depth).toBe(1)
    expect(a1.end - a1.start).toBeCloseTo(0.6)
    // 分母没变：A1 仍然是占全体的 30%
    expect(a1.share).toBeCloseTo(0.3)
    // 焦点之外的不画
    expect(view.some((n) => n.id === 'b')).toBe(false)

    // 焦点不在轴首时才看得出「摊满」不是碰巧：B 原本从 0.5 起，下钻后必须从 0 起
    const second = hierarchyView(model, 'b')
    const b = second.find((n) => n.id === 'b')!
    const b1 = second.find((n) => n.id === 'b1')!
    expect(model.nodes.find((n) => n.id === 'b')!.start).toBeCloseTo(0.5)
    expect(b.start).toBeCloseTo(0)
    expect(b.end).toBeCloseTo(1)
    expect(b1.start).toBeCloseTo(0)
    expect(b1.end).toBeCloseTo(1)
  })

  it('焦点为空或指向不存在的节点时，给的还是整棵树', () => {
    const model = buildHierarchy(flat)
    expect(hierarchyView(model, null)).toHaveLength(model.nodes.length)
    expect(hierarchyView(model, '不存在')).toHaveLength(model.nodes.length)
  })
})
