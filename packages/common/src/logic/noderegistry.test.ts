/**
 * E02 节点注册表：口径必须钉死在 common，UI 只是消费方。
 *
 * 覆盖：
 * - 按类型创建 / 插入不改画布核心
 * - 删除同步边与分组成员
 * - 未知类型只读占位（无 schema）
 * - 扩展注册表不需要改 mutation 助手
 * - Graph → Flow 投影吃 canvasShape
 */
import { describe, expect, it, beforeEach } from 'vitest'
import type { NodeTypeDefinition } from './noderegistry'
import {
  BUILTIN_NODE_TYPES,
  createNode,
  createRegistry,
  defaultNodeRegistry,
  deleteNodes,
  insertNode,
  resetNodeIdSeq,
  resolvePropertySchema,
  seedApprovalGraph,
  toFlowEdges,
  toFlowNodes,
  updateNodeData,
  updateNodeLabel
} from './noderegistry'
import { emptyGraph } from './graph'

describe('节点注册表', () => {
  beforeEach(() => {
    resetNodeIdSeq(0)
  })

  it('内置类型可列出，且 knownTypes 与 list 一致', () => {
    const types = defaultNodeRegistry.knownTypes()
    expect(types).toContain('start')
    expect(types).toContain('approve')
    expect(defaultNodeRegistry.list().map((d) => d.type)).toEqual([...types])
  })

  it('按类型创建节点：端口、标签、data 来自定义，不在注册表里则拒绝', () => {
    const node = createNode(defaultNodeRegistry, 'approve', {
      id: 'a1',
      x: 10,
      y: 20,
      data: { approver: '李四', required: false }
    })
    expect(node).toMatchObject({
      id: 'a1',
      type: 'approve',
      x: 10,
      y: 20,
      label: '审批',
      data: { approver: '李四', required: false }
    })
    expect(node?.ports?.map((p) => p.id)).toEqual(['in', 'pass', 'reject'])
    expect(createNode(defaultNodeRegistry, 'ghost-type')).toBeNull()
  })

  it('插入冲突 id 时拒绝，避免静默覆盖', () => {
    const a = createNode(defaultNodeRegistry, 'start', { id: 'n1' })!
    const first = insertNode(emptyGraph('t'), a)
    expect(first.status).toBe('ok')
    if (first.status !== 'ok') return
    const dup = insertNode(first.document, a)
    expect(dup).toEqual({ status: 'duplicate', reason: '节点 id 已存在：n1' })
  })

  it('删除节点时同步边与分组成员', () => {
    const doc = seedApprovalGraph()
    expect(doc.edges).toHaveLength(2)
    expect(doc.groups[0].nodeIds).toEqual(['n-start', 'n-approve', 'n-end'])

    const next = deleteNodes(doc, ['n-approve'])
    expect(next.nodes.map((n) => n.id)).toEqual(['n-start', 'n-end'])
    expect(next.edges).toEqual([])
    expect(next.groups[0].nodeIds).toEqual(['n-start', 'n-end'])
  })

  it('未知类型没有可编辑 schema，只给只读原因', () => {
    let doc = emptyGraph('x')
    doc = {
      ...doc,
      nodes: [
        {
          id: 'u1',
          type: 'legacy-vendor',
          x: 0,
          y: 0,
          label: '旧插件',
          data: { foo: 1 }
        }
      ]
    }
    const resolved = resolvePropertySchema(defaultNodeRegistry, doc, 'u1')
    expect(resolved.status).toBe('unknown')
    if (resolved.status === 'unknown') {
      expect(resolved.reason).toMatch(/legacy-vendor|不认识|只读/)
    }
    expect(resolvePropertySchema(defaultNodeRegistry, doc, 'missing').status).toBe('missing')

    const start = createNode(defaultNodeRegistry, 'start', { id: 's1' })!
    const inserted = insertNode(doc, start)
    if (inserted.status !== 'ok') throw new Error('insert failed')
    const editable = resolvePropertySchema(defaultNodeRegistry, inserted.document, 's1')
    expect(editable.status).toBe('editable')
    if (editable.status === 'editable') {
      expect(editable.schema.fields.some((f) => f.name === 'title')).toBe(true)
    }
  })

  it('扩展注册表只需加定义，mutation 助手不用改', () => {
    const custom: NodeTypeDefinition = {
      type: 'notify',
      label: '通知',
      category: '扩展',
      icon: 'sparkle',
      canvasShape: 'process',
      defaultLabel: '通知',
      defaultPorts: [
        { id: 'in', side: 'in' },
        { id: 'out', side: 'out' }
      ],
      defaultData: { channel: 'email' },
      propertySchema: {
        fields: [{ name: 'channel', label: '渠道', kind: 'text' }]
      }
    }
    const registry = createRegistry([...BUILTIN_NODE_TYPES, custom])
    const node = createNode(registry, 'notify', { id: 'n1' })
    expect(node?.type).toBe('notify')
    expect(node?.data).toEqual({ channel: 'email' })
    const inserted = insertNode(emptyGraph(), node!)
    expect(inserted.status).toBe('ok')
    if (inserted.status !== 'ok') return
    const resolved = resolvePropertySchema(registry, inserted.document, 'n1')
    expect(resolved.status).toBe('editable')
  })

  it('投影到 Flow 时吃 canvasShape；改 data / label 不碰几何', () => {
    const doc = seedApprovalGraph()
    const flowNodes = toFlowNodes(doc)
    expect(flowNodes.find((n) => n.id === 'n-start')?.type).toBe('start')
    expect(flowNodes.find((n) => n.id === 'n-approve')?.type).toBe('process')
    expect(toFlowEdges(doc).map((e) => `${e.from}->${e.to}`)).toEqual([
      'n-start->n-approve',
      'n-approve->n-end'
    ])

    const labeled = updateNodeLabel(doc, 'n-approve', '财务审批')
    const withData = updateNodeData(labeled, 'n-approve', { approver: '王五', required: true })
    expect(withData.nodes.find((n) => n.id === 'n-approve')).toMatchObject({
      label: '财务审批',
      data: { approver: '王五', required: true },
      x: 240,
      y: 80
    })
  })
})
