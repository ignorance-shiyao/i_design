/**
 * 流程文档的回归测试。
 *
 * 重点全在「存起来、以后再打开」这件事上：往返无损、版本迁移、
 * 读到更新的版本时拒绝、不认识的节点不丢。
 * 这几种都不会在开发时出现——它们要等到有人用旧版打开新文件才出现。
 */
import { describe, expect, it } from 'vitest'
import { GRAPH_VERSION } from '../contracts/graph'
import { emptyGraph, graphIssues, parseGraph, serializeGraph, unknownNodes } from './graph'

const doc = {
  version: GRAPH_VERSION,
  nodes: [
    { id: 'n1', type: 'start', x: 10, y: 20, label: '提交', 未来字段: { 备注: '新版加的' } },
    { id: 'n2', type: 'approve', x: 200, y: 20, label: '审批' }
  ],
  edges: [{ id: 'e1', from: 'n1', to: 'n2', label: '通过', 新属性: 1 }],
  groups: [{ id: 'g1', label: '销售线', nodeIds: ['n1', 'n2'] }],
  viewport: { x: 0, y: 0, zoom: 1 },
  meta: { title: '采购审批', updatedAt: 1, 团队: 'ops' },
  文档级新字段: true
}

describe('往返', () => {
  it('不认识的字段原样留着，保存一次不会消失', () => {
    const parsed = parseGraph(JSON.stringify(doc))
    expect(parsed.status).toBe('ok')
    if (parsed.status !== 'ok') return
    expect(parsed.document.nodes[0].extras).toEqual({ 未来字段: { 备注: '新版加的' } })
    expect(parsed.document.meta.extras).toEqual({ 团队: 'ops' })
    expect(parsed.document.extras).toEqual({ 文档级新字段: true })

    // 往返之后与原文逐字段相同
    expect(JSON.parse(serializeGraph(parsed.document))).toEqual(doc)
  })

  it('连续解析两次结果一致——第二次不该把 extras 又包一层', () => {
    const once = parseGraph(JSON.stringify(doc))
    if (once.status !== 'ok') throw new Error('第一次就没解析成功')
    const twice = parseGraph(serializeGraph(once.document))
    if (twice.status !== 'ok') throw new Error('第二次没解析成功')
    expect(twice.document).toEqual(once.document)
  })
})

describe('版本', () => {
  it('v1 的泳道迁移成 v2 的分组', () => {
    const v1 = {
      version: 1,
      nodes: [
        { id: 'n1', type: 'start', x: 0, y: 0, label: '开始', lane: '销售' },
        { id: 'n2', type: 'end', x: 100, y: 0, label: '结束', lane: '销售' }
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      meta: {}
    }
    const parsed = parseGraph(JSON.stringify(v1))
    if (parsed.status !== 'ok') throw new Error('迁移失败')
    expect(parsed.migratedFrom).toBe(1)
    expect(parsed.document.groups).toEqual([{ id: 'lane-销售', label: '销售', nodeIds: ['n1', 'n2'] }])
    expect(parsed.document.nodes[0].groupId).toBe('lane-销售')
    // 迁移之后 lane 字段不该还留在节点上，否则下次打开会再迁一遍
    expect(parsed.document.nodes[0].extras).toBeUndefined()
  })

  it('读到比自己新的版本时拒绝，而不是按当前版本去猜', () => {
    const result = parseGraph(JSON.stringify({ ...doc, version: GRAPH_VERSION + 5 }))
    expect(result).toEqual({ status: 'too-new', found: GRAPH_VERSION + 5, expected: GRAPH_VERSION })
  })

  it('没有迁移路径时说清楚，而不是抛一个看不懂的错', () => {
    expect(parseGraph(JSON.stringify({ version: 0, nodes: [] }))).toEqual({
      status: 'broken',
      reason: '没有从 v0 到 v1 的迁移'
    })
  })

  it('坏 JSON 与非对象都能说出原因', () => {
    expect(parseGraph('{ 不是 JSON')).toEqual({ status: 'broken', reason: '不是合法的 JSON' })
    // 顶层是数组时 typeof 同样是 object，放过去会一路走到「没有迁移」，
    // 报出来的原因与真正的问题毫无关系
    expect(parseGraph(JSON.stringify([1, 2]))).toEqual({ status: 'broken', reason: '文档不是一个对象' })
    expect(parseGraph('null')).toEqual({ status: 'broken', reason: '文档不是一个对象' })
  })
})

describe('不认识的节点', () => {
  it('不丢弃，标成只读占位并说明原因', () => {
    const parsed = parseGraph(JSON.stringify(doc))
    if (parsed.status !== 'ok') throw new Error('解析失败')
    const unknown = unknownNodes(parsed.document, ['start'])
    expect(unknown).toHaveLength(1)
    expect(unknown[0].node.id).toBe('n2')
    expect(unknown[0].reason).toContain('approve')
    // 关键在于它还在文档里：保存一次不会把它删掉
    expect(serializeGraph(parsed.document)).toContain('approve')
  })
})

describe('文档校验', () => {
  it('悬空的边、缺失的分组成员、重复 id 都报出来', () => {
    const broken = {
      ...emptyGraph('x'),
      nodes: [{ id: 'n1', type: 'start', x: 0, y: 0, label: 'a' }, { id: 'n1', type: 'end', x: 1, y: 1, label: 'b' }],
      edges: [{ id: 'e1', from: 'n1', to: '不存在' }],
      groups: [{ id: 'g1', label: '组', nodeIds: ['n1', '也不存在'] }]
    }
    const issues = graphIssues(broken)
    expect(issues.some((i) => i.includes('不存在的节点'))).toBe(true)
    expect(issues.some((i) => i.includes('成员节点不存在'))).toBe(true)
    expect(issues.some((i) => i.includes('id 重复'))).toBe(true)
  })

  it('缩放为 0 会让整张图消失，解析时纠正成 1', () => {
    const parsed = parseGraph(JSON.stringify({ ...doc, viewport: { x: 0, y: 0, zoom: 0 } }))
    if (parsed.status !== 'ok') throw new Error('解析失败')
    expect(parsed.document.viewport.zoom).toBe(1)
  })
})
