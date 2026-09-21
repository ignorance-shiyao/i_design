/**
 * 节点注册表与文档变更（astra.md 的 E02）。
 *
 * 画布（IFlow）只懂几何形状；真正「这是什么业务节点、属性表长什么样、
 * 删掉时边怎么跟着走」写在这一层。三条口径定死：
 *
 * 1. **属性由 schema 驱动**——节点类型声明 FormSchema，检查器直接喂给 SchemaForm，
 *    不在画布核心里写 if (type === 'approve')。
 * 2. **加一种业务节点 = 往注册表塞一条定义**，不许改 IFlow / flow.ts。
 * 3. **删除同步边与分组成员**——悬空边与幽灵成员是以后最难查的脏数据。
 *
 * GraphDocument 是持久化真相；FlowNode / FlowEdge 是投影。两端模型不要混着用。
 */
import type { FormSchema } from '../contracts/form'
import type {
  GraphDocument,
  GraphEdge,
  GraphNode,
  GraphPort
} from '../contracts/graph'
import type { IconName } from '../icons/index'
import { NODE_H, NODE_W, type FlowEdge, type FlowNode } from './flow'
import { emptyGraph, unknownNodes } from './graph'

/** 画布上已有的四种几何形状；业务类型通过 canvasShape 映射过去 */
export type CanvasShape = NonNullable<FlowNode['type']>

export interface NodeTypeDefinition {
  type: string
  label: string
  /** 工具箱分组，例如「基础」「审批」 */
  category: string
  icon: IconName
  /** 新建时的默认端口；连线编辑（E03）会读它，这里只负责声明 */
  defaultPorts: GraphPort[]
  defaultLabel: string
  defaultData?: Record<string, unknown>
  /** 属性检查器的表单；未知类型没有 schema，只读占位 */
  propertySchema: FormSchema
  canvasShape: CanvasShape
  defaultWidth?: number
  defaultHeight?: number
}

export interface NodeRegistry {
  get(type: string): NodeTypeDefinition | undefined
  list(): readonly NodeTypeDefinition[]
  knownTypes(): readonly string[]
}

export interface CreateNodeOptions {
  id?: string
  x?: number
  y?: number
  label?: string
  data?: Record<string, unknown>
  width?: number
  height?: number
  groupId?: string
  ports?: GraphPort[]
}

/** 属性面板拿到的结果：可编辑 schema，或只读占位原因 */
export type PropertyResolution =
  | { status: 'editable'; schema: FormSchema; definition: NodeTypeDefinition }
  | { status: 'unknown'; reason: string }
  | { status: 'missing'; reason: string }

let idSeq = 0

/** 测试里重置序号，避免用例之间互相污染 */
export function resetNodeIdSeq(next = 0) {
  idSeq = next
}

function nextId(prefix: string): string {
  idSeq += 1
  return `${prefix}-${idSeq}`
}

const inPort = (id = 'in', label?: string): GraphPort => ({
  id,
  side: 'in',
  ...(label ? { label } : {})
})
const outPort = (id = 'out', label?: string): GraphPort => ({
  id,
  side: 'out',
  ...(label ? { label } : {})
})

function cloneData(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!data) return undefined
  return { ...data }
}

/**
 * 内置审批流常用类型。业务方用 createRegistry([...BUILTIN_NODE_TYPES, ...mine])
 * 扩展；不要去改画布组件。
 */
export const BUILTIN_NODE_TYPES: readonly NodeTypeDefinition[] = [
  {
    type: 'start',
    label: '开始',
    category: '基础',
    icon: 'sparkle',
    canvasShape: 'start',
    defaultLabel: '开始',
    defaultPorts: [outPort()],
    defaultData: { title: '' },
    propertySchema: {
      fields: [
        {
          name: 'title',
          label: '标题',
          kind: 'text',
          rules: [{ kind: 'required', message: '请填写标题' }]
        }
      ]
    }
  },
  {
    type: 'process',
    label: '处理',
    category: '基础',
    icon: 'edit',
    canvasShape: 'process',
    defaultLabel: '处理',
    defaultPorts: [inPort(), outPort()],
    defaultData: { owner: '' },
    propertySchema: {
      fields: [
        { name: 'owner', label: '负责人', kind: 'text' },
        { name: 'note', label: '说明', kind: 'textarea' }
      ]
    }
  },
  {
    type: 'decision',
    label: '判断',
    category: '基础',
    icon: 'filter',
    canvasShape: 'decision',
    defaultLabel: '判断',
    defaultPorts: [inPort(), outPort('yes', '是'), outPort('no', '否')],
    defaultData: { expression: '' },
    propertySchema: {
      fields: [
        {
          name: 'expression',
          label: '条件',
          kind: 'text',
          rules: [{ kind: 'required', message: '请填写条件' }]
        }
      ]
    }
  },
  {
    type: 'end',
    label: '结束',
    category: '基础',
    icon: 'check-circle',
    canvasShape: 'end',
    defaultLabel: '结束',
    defaultPorts: [inPort()],
    defaultData: { summary: '' },
    propertySchema: {
      fields: [{ name: 'summary', label: '结果说明', kind: 'textarea' }]
    }
  },
  {
    type: 'approve',
    label: '审批',
    category: '审批',
    icon: 'user',
    canvasShape: 'process',
    defaultLabel: '审批',
    defaultPorts: [inPort(), outPort('pass', '通过'), outPort('reject', '驳回')],
    defaultData: { approver: '', required: true },
    propertySchema: {
      fields: [
        {
          name: 'approver',
          label: '审批人',
          kind: 'text',
          rules: [{ kind: 'required', message: '请指定审批人' }]
        },
        { name: 'required', label: '必须审批', kind: 'switch' }
      ]
    }
  }
]

/** 从定义列表装配注册表。同 type 后写覆盖前写。 */
export function createRegistry(definitions: readonly NodeTypeDefinition[]): NodeRegistry {
  const map = new Map<string, NodeTypeDefinition>()
  for (const def of definitions) {
    if (!def.type) continue
    map.set(def.type, def)
  }
  const list = Object.freeze([...map.values()])
  const known = Object.freeze(list.map((d) => d.type))
  return {
    get(type) {
      return map.get(type)
    },
    list() {
      return list
    },
    knownTypes() {
      return known
    }
  }
}

export const defaultNodeRegistry = createRegistry(BUILTIN_NODE_TYPES)

/**
 * 按类型创建节点。类型不在注册表里时返回 null——
 * 业务方不该靠「先塞一个未知类型再补定义」偷偷绕过工具箱。
 */
export function createNode(
  registry: NodeRegistry,
  type: string,
  options: CreateNodeOptions = {}
): GraphNode | null {
  const def = registry.get(type)
  if (!def) return null
  const ports = (options.ports ?? def.defaultPorts).map((p) => ({ ...p }))
  const data = cloneData(options.data ?? def.defaultData) ?? {}
  return {
    id: options.id ?? nextId('node'),
    type: def.type,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? def.defaultWidth ?? NODE_W,
    height: options.height ?? def.defaultHeight ?? NODE_H,
    label: options.label ?? def.defaultLabel,
    ports,
    data,
    ...(options.groupId ? { groupId: options.groupId } : {})
  }
}

/** 插入节点。id 冲突时拒绝，避免静默覆盖。 */
export function insertNode(
  document: GraphDocument,
  node: GraphNode
): { status: 'ok'; document: GraphDocument } | { status: 'duplicate'; reason: string } {
  if (document.nodes.some((n) => n.id === node.id)) {
    return { status: 'duplicate', reason: `节点 id 已存在：${node.id}` }
  }
  return {
    status: 'ok',
    document: {
      ...document,
      nodes: [...document.nodes, node]
    }
  }
}

/**
 * 删除节点，并同步：
 * - 去掉任一端落在这些节点上的边
 * - 从分组成员里摘掉它们
 * - 清掉仍指向已删分组的 groupId（若分组本身也被删）
 */
export function deleteNodes(document: GraphDocument, ids: readonly string[]): GraphDocument {
  if (!ids.length) return document
  const remove = new Set(ids)
  const groups = document.groups
    .filter((g) => !remove.has(g.id))
    .map((g) => ({
      ...g,
      nodeIds: g.nodeIds.filter((id) => !remove.has(id))
    }))
  const survivingGroupIds = new Set(groups.map((g) => g.id))
  const nodes = document.nodes
    .filter((n) => !remove.has(n.id))
    .map((n) => {
      if (n.groupId && !survivingGroupIds.has(n.groupId)) {
        const { groupId: _gone, ...rest } = n
        return rest
      }
      return n
    })
  const edges = document.edges.filter((e) => !remove.has(e.from) && !remove.has(e.to))
  return { ...document, nodes, edges, groups }
}

export function updateNodeData(
  document: GraphDocument,
  id: string,
  data: Record<string, unknown>
): GraphDocument {
  return {
    ...document,
    nodes: document.nodes.map((n) => (n.id === id ? { ...n, data: { ...data } } : n))
  }
}

export function updateNodeLabel(document: GraphDocument, id: string, label: string): GraphDocument {
  return {
    ...document,
    nodes: document.nodes.map((n) => (n.id === id ? { ...n, label } : n))
  }
}

/** 属性检查器入口：未知类型给只读原因，不假装可编辑。 */
export function resolvePropertySchema(
  registry: NodeRegistry,
  document: GraphDocument,
  nodeId: string
): PropertyResolution {
  const node = document.nodes.find((n) => n.id === nodeId)
  if (!node) return { status: 'missing', reason: '节点不存在' }
  const def = registry.get(node.type)
  if (!def) {
    const unknown = unknownNodes(document, registry.knownTypes()).find((u) => u.node.id === nodeId)
    return {
      status: 'unknown',
      reason: unknown?.reason ?? `当前版本不认识「${node.type}」这种节点，已按只读占位显示`
    }
  }
  return { status: 'editable', schema: def.propertySchema, definition: def }
}

/** GraphDocument → IFlow 投影。画布不读 ports / data，只拿几何与形状。 */
export function toFlowNodes(
  document: GraphDocument,
  registry: NodeRegistry = defaultNodeRegistry
): FlowNode[] {
  return document.nodes.map((node) => {
    const shape = registry.get(node.type)?.canvasShape ?? 'process'
    return {
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      label: node.label,
      type: shape
    }
  })
}

export function toFlowEdges(document: GraphDocument): FlowEdge[] {
  return document.edges.map((edge: GraphEdge) => ({
    from: edge.from,
    to: edge.to,
    label: edge.label
  }))
}

/** 从空文档按类型序列拼一条演示流，方便文档页与故障注入。 */
export function seedApprovalGraph(registry: NodeRegistry = defaultNodeRegistry): GraphDocument {
  let doc = emptyGraph('采购审批')
  const start = createNode(registry, 'start', {
    id: 'n-start',
    x: 40,
    y: 80,
    data: { title: '提交申请' },
    groupId: 'g-sales'
  })
  const approve = createNode(registry, 'approve', {
    id: 'n-approve',
    x: 240,
    y: 80,
    data: { approver: '张三', required: true },
    groupId: 'g-sales'
  })
  const end = createNode(registry, 'end', {
    id: 'n-end',
    x: 440,
    y: 80,
    data: { summary: '归档' },
    groupId: 'g-sales'
  })
  for (const node of [start, approve, end]) {
    if (!node) continue
    const inserted = insertNode(doc, node)
    if (inserted.status === 'ok') doc = inserted.document
  }
  return {
    ...doc,
    edges: [
      { id: 'e1', from: 'n-start', to: 'n-approve', label: '提交' },
      { id: 'e2', from: 'n-approve', to: 'n-end', fromPort: 'pass', label: '通过' }
    ],
    groups: [{ id: 'g-sales', label: '销售线', nodeIds: ['n-start', 'n-approve', 'n-end'] }]
  }
}
