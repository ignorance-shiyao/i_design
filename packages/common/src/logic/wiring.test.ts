/**
 * E03 连线校验：每条断言对应 astra 里的一条验收——
 * 自环、悬空、重复边、方向/类型不匹配都要有**可定位**的错误，
 * 环按图类型处理而不是一律禁。
 */
import { beforeEach, describe, expect, it } from 'vitest'
import type { GraphDocument } from '../contracts/graph'
import { emptyGraph } from './graph'
import {
  canConnect,
  connectEdge,
  disconnectEdge,
  reconnectEdge,
  resetEdgeIdSeq,
  setEdgeType,
  validateWiring
} from './wiring'

function graph(): GraphDocument {
  return {
    ...emptyGraph('审批'),
    nodes: [
      {
        id: 'a',
        type: 'start',
        x: 0,
        y: 0,
        label: '提交',
        ports: [{ id: 'out', side: 'out' }]
      },
      {
        id: 'b',
        type: 'approve',
        x: 200,
        y: 0,
        label: '审批',
        ports: [
          { id: 'in', side: 'in', accepts: ['flow'] },
          { id: 'pass', side: 'out' },
          { id: 'reject', side: 'out' }
        ]
      },
      {
        id: 'c',
        type: 'end',
        x: 400,
        y: 0,
        label: '归档',
        ports: [{ id: 'in', side: 'in' }]
      }
    ]
  }
}

describe('连线', () => {
  beforeEach(() => resetEdgeIdSeq(0))

  it('连得上时给出新文档，原文档不动', () => {
    const doc = graph()
    const result = connectEdge(doc, { from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' })
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.edge.id).toBe('edge-1')
    expect(result.document.edges).toHaveLength(1)
    expect(doc.edges).toHaveLength(0)
  })

  it('方向不匹配点名具体端口，而不是只说非法', () => {
    const result = connectEdge(graph(), { from: 'b', to: 'c', fromPort: 'in', toPort: 'in' })
    expect(result.status).toBe('rejected')
    if (result.status !== 'rejected') return
    const issue = result.issues.find((i) => i.code === 'direction')
    expect(issue?.message).toMatch(/端口 in 是入口/)
    expect(issue?.target).toBe('node:b.port:in')
  })

  it('端口不存在时不退回按节点连——那会静默改掉语义', () => {
    const result = connectEdge(graph(), { from: 'a', to: 'b', fromPort: 'ghost', toPort: 'in' })
    expect(result.status).toBe('rejected')
    if (result.status !== 'rejected') return
    expect(result.issues.map((i) => i.code)).toContain('port-missing')
    expect(result.issues[0].target).toBe('node:a.port:ghost')
  })

  it('悬空的一端点名是哪个节点不存在', () => {
    const result = connectEdge(graph(), { from: 'a', to: 'ghost' })
    expect(result.status).toBe('rejected')
    if (result.status !== 'rejected') return
    expect(result.issues[0]).toMatchObject({ code: 'dangling', target: 'node:ghost', nodeId: 'ghost' })
  })

  it('同一对端口之间的第二条线被拒，并指向已有那条', () => {
    const first = connectEdge(graph(), { from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' })
    if (first.status !== 'ok') throw new Error('第一条就没连上')
    const again = connectEdge(first.document, {
      from: 'a',
      to: 'b',
      fromPort: 'out',
      toPort: 'in',
      type: 'flow'
    })
    expect(again.status).toBe('rejected')
    if (again.status !== 'rejected') return
    expect(again.issues[0]).toMatchObject({ code: 'duplicate', target: 'edge:edge-1' })
  })

  it('端口写了 accepts 就按它收，收不了的说清收什么', () => {
    const result = connectEdge(graph(), {
      from: 'a',
      to: 'b',
      fromPort: 'out',
      toPort: 'in',
      type: 'data'
    })
    expect(result.status).toBe('rejected')
    if (result.status !== 'rejected') return
    expect(result.issues[0]).toMatchObject({ code: 'type-mismatch', portId: 'in' })
    expect(result.issues[0].message).toMatch(/只收 flow/)
  })

  it('白名单之外的连线类型被拒', () => {
    const result = connectEdge(
      graph(),
      { from: 'a', to: 'c', fromPort: 'out', toPort: 'in', type: 'telepathy' },
      { edgeTypes: ['flow', 'reject'] }
    )
    expect(result.status).toBe('rejected')
    if (result.status !== 'rejected') return
    expect(result.issues.map((i) => i.code)).toContain('unknown-type')
  })
})

describe('自环与环按图类型处理', () => {
  beforeEach(() => resetEdgeIdSeq(0))

  it('状态机允许自环，DAG 不允许', () => {
    const doc = graph()
    expect(connectEdge(doc, { from: 'b', to: 'b' }, { kind: 'cyclic' }).status).toBe('ok')
    const dag = connectEdge(doc, { from: 'b', to: 'b' }, { kind: 'dag' })
    expect(dag.status).toBe('rejected')
    if (dag.status !== 'rejected') return
    // 报 self-loop 而不是 cycle：说「连回自己」比说「成环」更贴近用户刚做的动作
    expect(dag.issues[0]).toMatchObject({ code: 'self-loop', nodeId: 'b' })
  })

  it('DAG 里就算显式放开自环，环这条规则照样拦', () => {
    const result = connectEdge(graph(), { from: 'b', to: 'b' }, { kind: 'dag', allowSelfLoop: true })
    expect(result.status).toBe('rejected')
    if (result.status !== 'rejected') return
    expect(result.issues[0]).toMatchObject({ code: 'cycle', cycle: ['b', 'b'] })
  })

  it('状态机里显式禁自环时报 self-loop 而不是 cycle', () => {
    const result = connectEdge(graph(), { from: 'b', to: 'b' }, { kind: 'cyclic', allowSelfLoop: false })
    expect(result.status).toBe('rejected')
    if (result.status !== 'rejected') return
    expect(result.issues[0]).toMatchObject({ code: 'self-loop', nodeId: 'b' })
  })

  it('DAG 里的回边报出整条环路，而不是只说图里有环', () => {
    let doc = graph()
    for (const edge of [
      { from: 'a', to: 'b', type: 'flow' },
      { from: 'b', to: 'c' }
    ]) {
      const step = connectEdge(doc, edge, { kind: 'dag' })
      if (step.status !== 'ok') throw new Error('铺底边失败')
      doc = step.document
    }
    const back = connectEdge(doc, { from: 'c', to: 'a' }, { kind: 'dag' })
    expect(back.status).toBe('rejected')
    if (back.status !== 'rejected') return
    expect(back.issues[0].cycle).toEqual(['a', 'b', 'c', 'a'])
    expect(back.issues[0].message).toMatch(/提交 → 审批 → 归档 → 提交/)
    // 同一条回边在审批流里是「驳回」，应当放行
    expect(connectEdge(doc, { from: 'c', to: 'a' }, { kind: 'cyclic' }).status).toBe('ok')
  })
})

describe('断开与重连', () => {
  beforeEach(() => resetEdgeIdSeq(0))

  it('重连失败时原图一个字都不动', () => {
    const first = connectEdge(graph(), { from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' })
    if (first.status !== 'ok') throw new Error('连不上')
    const bad = reconnectEdge(first.document, 'edge-1', { toPort: 'pass' })
    expect(bad.status).toBe('rejected')
    if (bad.status !== 'rejected') return
    expect(bad.issues[0].code).toBe('direction')
    expect(first.document.edges[0].toPort).toBe('in')
  })

  it('重连到另一个终点时不把自己算成重复边', () => {
    const first = connectEdge(graph(), { from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' })
    if (first.status !== 'ok') throw new Error('连不上')
    const moved = reconnectEdge(first.document, 'edge-1', { to: 'c', toPort: 'in' })
    expect(moved.status).toBe('ok')
    if (moved.status !== 'ok') return
    expect(moved.document.edges).toHaveLength(1)
    expect(moved.document.edges[0]).toMatchObject({ id: 'edge-1', to: 'c', toPort: 'in' })
  })

  it('换类型走同一套校验', () => {
    const first = connectEdge(graph(), { from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' })
    if (first.status !== 'ok') throw new Error('连不上')
    expect(setEdgeType(first.document, 'edge-1', 'data').status).toBe('rejected')
    const ok = setEdgeType(first.document, 'edge-1', 'flow')
    expect(ok.status).toBe('ok')
  })

  it('断开永远成立', () => {
    const first = connectEdge(graph(), { from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' })
    if (first.status !== 'ok') throw new Error('连不上')
    expect(disconnectEdge(first.document, 'edge-1').edges).toEqual([])
    expect(disconnectEdge(first.document, 'ghost').edges).toHaveLength(1)
  })

  it('重连一条不存在的边说清楚，而不是静默造一条', () => {
    const result = reconnectEdge(graph(), 'ghost', { to: 'c' })
    expect(result.status).toBe('rejected')
    if (result.status !== 'rejected') return
    expect(result.issues[0]).toMatchObject({ code: 'dangling', target: 'edge:ghost' })
  })
})

describe('整图校验', () => {
  it('逐条报问题，同一个环只报一次', () => {
    const doc: GraphDocument = {
      ...graph(),
      edges: [
        { id: 'e1', from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' },
        { id: 'e2', from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' },
        { id: 'e3', from: 'b', to: 'ghost' },
        { id: 'e4', from: 'b', to: 'c', toPort: 'in' },
        { id: 'e5', from: 'c', to: 'a' }
      ]
    }
    const issues = validateWiring(doc, { kind: 'dag' })
    const codes = issues.map((i) => i.code)
    expect(codes).toContain('duplicate')
    expect(codes).toContain('dangling')
    expect(codes.filter((c) => c === 'cycle')).toHaveLength(1)
    // 每条问题都要能跳过去
    expect(issues.every((i) => /^(edge|node):/.test(i.target))).toBe(true)
  })

  it('干净的图没有问题', () => {
    const doc: GraphDocument = {
      ...graph(),
      edges: [
        { id: 'e1', from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' },
        { id: 'e2', from: 'b', to: 'c', fromPort: 'pass', toPort: 'in' }
      ]
    }
    expect(validateWiring(doc, { kind: 'dag' })).toEqual([])
  })

  it('拖拽时的即时反馈给一句话原因', () => {
    expect(canConnect(graph(), { from: 'a', to: 'b', fromPort: 'out', toPort: 'in', type: 'flow' })).toEqual({
      ok: true,
      reason: ''
    })
    const bad = canConnect(graph(), { from: 'a', to: 'b', fromPort: 'out', toPort: 'pass' })
    expect(bad.ok).toBe(false)
    expect(bad.reason).toMatch(/端口 pass 是出口/)
  })
})
