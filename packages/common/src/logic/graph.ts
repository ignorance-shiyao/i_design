/**
 * 流程文档的解析、迁移与校验。
 *
 * 三条规则决定了这一层的形状，它们都来自「这份数据会被存起来、以后再打开」：
 *
 * 1. **往返无损**。解析时不认识的字段原样留着，保存时写回去。
 *    不这么做的话，新版里加的泳道被旧版打开、保存一次就没了——
 *    没有报错，只有一句「我上周画的东西不见了」。
 * 2. **不认识的节点不丢弃**，标成只读占位并说明原因。
 *    丢弃等于替用户删内容；而显示一个「这个节点当前版本打不开」的占位，
 *    至少让他知道该去升级哪一端。
 * 3. **版本只升不降**。读到比自己新的版本时拒绝并说明，
 *    而不是按当前版本的字段去猜。
 */
import {
  GRAPH_VERSION,
  type GraphDocument, type GraphEdge, type GraphGroup, type GraphNode, type GraphPort
} from '../contracts/graph'

/** 已知字段之外的都进 extras */
function splitExtras<T extends object>(raw: Record<string, unknown>, known: readonly string[]): {
  picked: Partial<T>
  extras: Record<string, unknown>
} {
  const picked: Record<string, unknown> = {}
  const extras: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (known.includes(key)) picked[key] = value
    else extras[key] = value
  }
  return { picked: picked as Partial<T>, extras }
}

const NODE_KEYS = ['id', 'type', 'x', 'y', 'width', 'height', 'label', 'ports', 'data', 'groupId'] as const
const EDGE_KEYS = ['id', 'from', 'to', 'fromPort', 'toPort', 'label', 'type'] as const
const GROUP_KEYS = ['id', 'label', 'nodeIds'] as const
const DOC_KEYS = ['version', 'nodes', 'edges', 'groups', 'viewport', 'meta'] as const
const META_KEYS = ['title', 'updatedAt', 'updatedBy'] as const

export type ParseResult =
  | { status: 'ok'; document: GraphDocument; migratedFrom?: number }
  | { status: 'too-new'; found: number; expected: number }
  | { status: 'broken'; reason: string }

/** 空文档。新建时用它，而不是让各处自己拼一个形状相近的对象 */
export function emptyGraph(title = ''): GraphDocument {
  return {
    version: GRAPH_VERSION,
    nodes: [],
    edges: [],
    groups: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    meta: { title }
  }
}

/**
 * v1 → v2 的迁移：v1 把泳道存成节点上的 `lane` 字符串，v2 改成独立的 groups。
 *
 * 迁移写成一条一条的函数而不是一个大 if：加第三版时只需要再加一条，
 * 而不是回头读懂上一版的分支。
 */
function migrateV1ToV2(raw: Record<string, unknown>): Record<string, unknown> {
  const nodes = Array.isArray(raw.nodes) ? (raw.nodes as Record<string, unknown>[]) : []
  const lanes = new Map<string, string[]>()
  for (const node of nodes) {
    const lane = typeof node.lane === 'string' ? node.lane : ''
    if (!lane) continue
    lanes.set(lane, [...(lanes.get(lane) ?? []), String(node.id)])
  }
  return {
    ...raw,
    version: 2,
    nodes: nodes.map((node) => {
      const { lane, ...rest } = node
      return lane ? { ...rest, groupId: `lane-${lane}` } : rest
    }),
    groups: [
      ...(Array.isArray(raw.groups) ? raw.groups : []),
      ...[...lanes].map(([label, nodeIds]) => ({ id: `lane-${label}`, label, nodeIds }))
    ]
  }
}

const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  1: migrateV1ToV2
}

/**
 * 解析一份文档。
 *
 * 入参是已经 JSON.parse 过的对象还是字符串都行——字符串坏掉的情况
 * 也要能说出原因，而不是抛一个 SyntaxError 到界面上。
 */
export function parseGraph(input: string | unknown): ParseResult {
  let raw: unknown = input
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input)
    } catch {
      return { status: 'broken', reason: '不是合法的 JSON' }
    }
  }
  // 数组也要挡：JSON 顶层是数组时 typeof 同样是 object，放过去会一路走到「没有迁移」，
  // 报出来的原因与真正的问题毫无关系
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { status: 'broken', reason: '文档不是一个对象' }
  }

  const record = raw as Record<string, unknown>
  const version = typeof record.version === 'number' ? record.version : 0
  if (version > GRAPH_VERSION) {
    // 不按当前版本去猜：新版里的字段含义可能完全不同，猜错会把图画成另一个样子
    return { status: 'too-new', found: version, expected: GRAPH_VERSION }
  }

  let current = record
  let migratedFrom: number | undefined
  for (let v = version; v < GRAPH_VERSION; v += 1) {
    const migrate = MIGRATIONS[v]
    if (!migrate) return { status: 'broken', reason: `没有从 v${v} 到 v${v + 1} 的迁移` }
    current = migrate(current)
    migratedFrom = migratedFrom ?? version
  }

  const { extras: docExtras } = splitExtras<GraphDocument>(current, DOC_KEYS)
  const metaRaw = (current.meta ?? {}) as Record<string, unknown>
  const { picked: meta, extras: metaExtras } = splitExtras<Record<string, unknown>>(metaRaw, META_KEYS)

  const nodes: GraphNode[] = (Array.isArray(current.nodes) ? current.nodes : []).map((item) => {
    const node = item as Record<string, unknown>
    const { picked, extras } = splitExtras<GraphNode>(node, NODE_KEYS)
    return {
      id: String(picked.id ?? ''),
      type: String(picked.type ?? 'unknown'),
      x: Number(picked.x ?? 0),
      y: Number(picked.y ?? 0),
      width: picked.width as number | undefined,
      height: picked.height as number | undefined,
      label: String(picked.label ?? ''),
      ports: picked.ports as GraphPort[] | undefined,
      data: picked.data as Record<string, unknown> | undefined,
      groupId: picked.groupId as string | undefined,
      ...(Object.keys(extras).length ? { extras } : {})
    }
  })

  const edges: GraphEdge[] = (Array.isArray(current.edges) ? current.edges : []).map((item) => {
    const { picked, extras } = splitExtras<GraphEdge>(item as Record<string, unknown>, EDGE_KEYS)
    return {
      id: String(picked.id ?? ''),
      from: String(picked.from ?? ''),
      to: String(picked.to ?? ''),
      fromPort: picked.fromPort as string | undefined,
      toPort: picked.toPort as string | undefined,
      label: picked.label as string | undefined,
      type: picked.type as string | undefined,
      ...(Object.keys(extras).length ? { extras } : {})
    }
  })

  const groups: GraphGroup[] = (Array.isArray(current.groups) ? current.groups : []).map((item) => {
    const { picked, extras } = splitExtras<GraphGroup>(item as Record<string, unknown>, GROUP_KEYS)
    return {
      id: String(picked.id ?? ''),
      label: String(picked.label ?? ''),
      nodeIds: Array.isArray(picked.nodeIds) ? picked.nodeIds.map(String) : [],
      ...(Object.keys(extras).length ? { extras } : {})
    }
  })

  const viewportRaw = (current.viewport ?? {}) as Record<string, unknown>

  return {
    status: 'ok',
    migratedFrom,
    document: {
      version: GRAPH_VERSION,
      nodes,
      edges,
      groups,
      viewport: {
        x: Number(viewportRaw.x ?? 0),
        y: Number(viewportRaw.y ?? 0),
        // 缩放为 0 会让整张图消失，而它多半是别处算错传进来的
        zoom: Number(viewportRaw.zoom) > 0 ? Number(viewportRaw.zoom) : 1
      },
      meta: { ...meta, ...(Object.keys(metaExtras).length ? { extras: metaExtras } : {}) },
      ...(Object.keys(docExtras).length ? { extras: docExtras } : {})
    }
  }
}

/** 序列化。extras 摊回原位，这样往返才真的无损 */
export function serializeGraph(document: GraphDocument): string {
  const flat = <T extends { extras?: Record<string, unknown> }>(item: T) => {
    const { extras, ...rest } = item
    return { ...rest, ...(extras ?? {}) }
  }
  const { extras, meta, nodes, edges, groups, ...rest } = document
  return JSON.stringify({
    ...rest,
    nodes: nodes.map(flat),
    edges: edges.map(flat),
    groups: groups.map(flat),
    meta: flat(meta),
    ...(extras ?? {})
  })
}

/**
 * 不认识的节点：不丢弃，标成只读占位并说明原因。
 *
 * 丢弃等于替用户删内容。占位至少让他知道该升级哪一端，
 * 而且保存时这个节点原样写回去，不会因为打开过一次就消失。
 */
export function unknownNodes(document: GraphDocument, knownTypes: readonly string[]): {
  node: GraphNode
  reason: string
}[] {
  return document.nodes
    .filter((node) => !knownTypes.includes(node.type))
    .map((node) => ({
      node,
      reason: `当前版本不认识「${node.type}」这种节点，已按只读占位显示；升级后可正常编辑`
    }))
}

/** 文档级校验：悬空的边、指向不存在节点的分组成员 */
export function graphIssues(document: GraphDocument): string[] {
  const ids = new Set(document.nodes.map((n) => n.id))
  const issues: string[] = []
  for (const edge of document.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      issues.push(`连线 ${edge.id} 指向不存在的节点，已保留但不会渲染`)
    }
  }
  for (const group of document.groups) {
    const missing = group.nodeIds.filter((id) => !ids.has(id))
    if (missing.length) issues.push(`分组「${group.label}」里有 ${missing.length} 个成员节点不存在`)
  }
  const seen = new Set<string>()
  for (const node of document.nodes) {
    if (seen.has(node.id)) issues.push(`节点 id 重复：${node.id}`)
    seen.add(node.id)
  }
  return issues
}
