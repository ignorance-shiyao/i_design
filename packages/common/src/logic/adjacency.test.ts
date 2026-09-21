import { describe, expect, it } from 'vitest'
import {
  adjacencyShade,
  buildAdjacency,
  type AdjacencyEdgeInput,
  type AdjacencyNodeInput
} from './adjacency'

const nodes: AdjacencyNodeInput[] = [
  { id: 'a', label: '甲', community: '东' },
  { id: 'b', label: '乙', community: '东' },
  { id: 'c', label: '丙', community: '西' },
  { id: 'd', label: '丁' }
]

/** 甲-乙 3，甲-丙 0，乙→丁 未观测；丁与所有人无边 */
const edges: AdjacencyEdgeInput[] = [
  { from: 'a', to: 'b', weight: 3 },
  { from: 'a', to: 'c', weight: 0 },
  { from: 'b', to: 'd', unknown: true }
]

describe('邻接矩阵：空格不是 0', () => {
  it('没有边是 absent/null，未观测是 unknown/null，权重 0 是 ready/0', () => {
    const model = buildAdjacency(nodes, edges, { sort: 'input', directed: false })
    expect(model.state).toBe('ready')
    // 甲→乙：有边
    expect(model.cells[0][1]).toMatchObject({ state: 'ready', value: 3, valueText: '3' })
    // 甲→丙：权重 0，不是空档
    expect(model.cells[0][2]).toMatchObject({ state: 'ready', value: 0, valueText: '0' })
    // 乙→丁：未观测
    expect(model.cells[1][3]).toMatchObject({ state: 'unknown', value: null, valueText: '—' })
    expect(model.cells[1][3].description).toContain('不是 0')
    // 甲→丁：确认没边
    expect(model.cells[0][3]).toMatchObject({ state: 'absent', value: null, valueText: '—' })
    expect(model.cells[0][3].description).toContain('没有边')
    // 对角线默认没边
    expect(model.cells[0][0]).toMatchObject({ state: 'absent', value: null })
    expect(model.counts).toMatchObject({ ready: 4, unknown: 2 }) // 无向镜像：3/0 各×2，unknown×2
    expect(model.basis).toContain('空格是没有边或未观测，不是 0')
  })

  it('色阶只涂 ready；absent / unknown 返回 null，不能涂成最浅档', () => {
    const model = buildAdjacency(nodes, edges, { sort: 'input' })
    expect(adjacencyShade(model.cells[0][1], model.min, model.max)).toBeGreaterThan(0)
    expect(adjacencyShade(model.cells[0][3], model.min, model.max)).toBeNull()
    expect(adjacencyShade(model.cells[1][3], model.min, model.max)).toBeNull()
    // 权重 0 仍是 ready，要有档位
    expect(adjacencyShade(model.cells[0][2], model.min, model.max)).not.toBeNull()
  })
})

describe('邻接矩阵：排序口径', () => {
  it('input 保持输入序', () => {
    const model = buildAdjacency(nodes, edges, { sort: 'input' })
    expect(model.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(model.sort).toBe('input')
  })

  it('degree 按度数降序，同分保留输入序', () => {
    const model = buildAdjacency(nodes, edges, { sort: 'degree', directed: false })
    // 甲：乙+丙 = 2；乙：甲+丁(unknown) = 2；丙：甲 = 1；丁：乙(unknown) = 1
    // 甲乙同分，甲在前；丙丁同分，丙在前
    expect(model.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(model.nodes[0].degree).toBe(2)
    expect(model.nodes[2].degree).toBe(1)
    expect(model.basis).toContain('按度数降序')
  })

  it('community 按社群字典序，无社群在最后', () => {
    const model = buildAdjacency(nodes, edges, { sort: 'community' })
    // 东(甲乙) 西(丙) 无(丁)
    expect(model.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd'])
    const reordered = buildAdjacency(
      [
        { id: 'd', label: '丁' },
        { id: 'c', label: '丙', community: '西' },
        { id: 'b', label: '乙', community: '东' },
        { id: 'a', label: '甲', community: '东' }
      ],
      edges,
      { sort: 'community' }
    )
    expect(reordered.nodes.map((n) => n.id)).toEqual(['b', 'a', 'c', 'd'])
  })

  it('不传 sort 直接无效，避免各端各自猜默认序', () => {
    const model = buildAdjacency(nodes, edges, { sort: 'mystery' as 'input' })
    expect(model.state).toBe('invalid')
    expect(model.caption).toContain('排序口径')
  })
})

describe('邻接矩阵：有向与排除', () => {
  it('有向图不镜像；无向图 (i,j)=(j,i)', () => {
    const undirected = buildAdjacency(nodes, [{ from: 'a', to: 'b', weight: 5 }], {
      sort: 'input',
      directed: false
    })
    expect(undirected.cells[0][1].value).toBe(5)
    expect(undirected.cells[1][0].value).toBe(5)

    const directed = buildAdjacency(nodes, [{ from: 'a', to: 'b', weight: 5 }], {
      sort: 'input',
      directed: true
    })
    expect(directed.cells[0][1].value).toBe(5)
    expect(directed.cells[1][0]).toMatchObject({ state: 'absent', value: null })
  })

  it('端点不在节点表、重复节点、空 ID 都进 excluded，不静默丢', () => {
    const model = buildAdjacency(
      [
        { id: 'a', label: '甲' },
        { id: 'a', label: '甲二' },
        { id: '', label: '空' },
        { id: 'b', label: '乙' }
      ],
      [
        { from: 'a', to: 'ghost', weight: 1 },
        { from: 'a', to: 'b', weight: 2 },
        { from: 'a', to: 'b', weight: 9 }
      ],
      { sort: 'input' }
    )
    expect(model.nodes.map((n) => n.id)).toEqual(['a', 'b'])
    expect(model.cells[0][1].value).toBe(9)
    expect(model.excluded.some((row) => row.reason.includes('重复'))).toBe(true)
    expect(model.excluded.some((row) => row.reason.includes('不在节点表'))).toBe(true)
    expect(model.excluded.some((row) => row.reason.includes('后写覆盖'))).toBe(true)
  })
})

describe('邻接矩阵：故障注入——改坏口径必须被断言抓住', () => {
  it('若把 absent 写成 0，计数与空档断言都会失败', () => {
    const model = buildAdjacency(nodes, [{ from: 'a', to: 'b', weight: 1 }], { sort: 'input' })
    const broken = model.cells.map((row) =>
      row.map((cell) =>
        cell.state === 'absent' ? { ...cell, state: 'ready' as const, value: 0, valueText: '0' } : cell
      )
    )
    expect(broken[0][2].value).toBe(0)
    expect(() => {
      expect(broken[0][2]).toMatchObject({ state: 'absent', value: null })
    }).toThrow()
  })

  it('若按标签重排而不是按度数，degree 序断言失败', () => {
    const rich: AdjacencyNodeInput[] = [
      { id: 'z', label: '末', community: '西' },
      { id: 'a', label: '首', community: '东' },
      { id: 'm', label: '中', community: '东' }
    ]
    const model = buildAdjacency(
      rich,
      [
        { from: 'a', to: 'm', weight: 1 },
        { from: 'a', to: 'z', weight: 1 }
        // a 度数 2；m、z 度数 1 且保留输入序 → a, z, m
      ],
      { sort: 'degree' }
    )
    const degreeOrder = model.nodes.map((n) => n.id)
    expect(degreeOrder).toEqual(['a', 'z', 'm'])
    const byLabel = [...model.nodes]
      .sort((x, y) => x.label.localeCompare(y.label, 'zh'))
      .map((n) => n.id)
    // 标签序与度数序必须不是同一件事——否则「按标签排」的假实现会混过去
    expect(byLabel).not.toEqual(degreeOrder)
    expect(() => {
      expect(byLabel).toEqual(degreeOrder)
    }).toThrow()
  })
})
