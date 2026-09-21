/**
 * 端口连线的编辑与校验（astra.md 的 E03）。
 *
 * 画布负责把两个端口连起来的手感；**这一层负责回答「这条线能不能连」**，
 * 并且在不能连的时候说出是哪一条线、哪一个节点、哪一个端口——
 * 一句「连线非法」等于没说，用户只能一条条试。
 *
 * 五条口径定死：
 *
 * 1. **方向按端口的 side 判**：出口只能当起点，入口只能当终点。
 *    不判方向的话，一张图里会同时存在「A 出→B 出」这种连法，
 *    跑的时候才发现走不通，而图上看起来完全正常。
 * 2. **端口必须真的存在**：指名了 fromPort / toPort 就要在节点上找得到。
 *    找不到时不许退回「按节点连」——那会静默改掉这条线的语义。
 * 3. **重复边合并不了就拒绝**：同一对端口之间的第二条线在图上与第一条重叠，
 *    看不出是两条，删一条会像没反应。
 * 4. **自环与环按图类型处理**，不是一律禁：状态机需要自转与回环，
 *    DAG（依赖、血缘）里一个环就是死循环。所以 kind 必须显式给。
 * 5. **类型不匹配要报**：端口写了 accepts 就按它收；边类型给了白名单
 *    就不许出现白名单外的类型。
 *
 * 校验结果是**一串可定位的问题**而不是一个布尔值：面板要能点着跳过去。
 */
import type { GraphDocument, GraphEdge, GraphNode, GraphPort } from '../contracts/graph'

export type EdgeIssueCode =
  | 'dangling'
  | 'self-loop'
  | 'duplicate'
  | 'direction'
  | 'port-missing'
  | 'type-mismatch'
  | 'unknown-type'
  | 'cycle'

export interface EdgeIssue {
  code: EdgeIssueCode
  /** 写给人看的原因，必须点名具体的边 / 节点 / 端口 */
  message: string
  /** 面板点一下要跳到哪儿：edge:e1 / node:n1 / node:n1.port:out */
  target: string
  edgeId?: string
  nodeId?: string
  portId?: string
  /** 成环时环上的节点，按顺序；其余情况为空 */
  cycle?: string[]
}

/**
 * 图类型。
 *
 * - `dag`：依赖、血缘、构建流水线。环是死循环，必须拦。
 * - `cyclic`：状态机、审批流的驳回回边。环是正常语义，自环也是。
 */
export type GraphKind = 'dag' | 'cyclic'

export interface WiringOptions {
  kind?: GraphKind
  /** 允许的连线类型白名单。不给＝不限制 */
  edgeTypes?: readonly string[]
  /**
   * 自环。默认跟着 kind：dag 不许，cyclic 许。
   * 显式给 false 可以在状态机里也禁掉自转。
   */
  allowSelfLoop?: boolean
}

export interface EdgeCandidate {
  id?: string
  from: string
  to: string
  fromPort?: string
  toPort?: string
  label?: string
  type?: string
}

export type WiringResult =
  | { status: 'ok'; document: GraphDocument; edge: GraphEdge }
  | { status: 'rejected'; issues: EdgeIssue[] }

let edgeSeq = 0

/** 测试里重置序号，避免用例之间互相污染 */
export function resetEdgeIdSeq(next = 0) {
  edgeSeq = next
}

function nextEdgeId(): string {
  edgeSeq += 1
  return `edge-${edgeSeq}`
}

const nodeOf = (document: GraphDocument, id: string): GraphNode | undefined =>
  document.nodes.find((n) => n.id === id)

const portOf = (node: GraphNode | undefined, id: string | undefined): GraphPort | undefined =>
  id === undefined ? undefined : (node?.ports ?? []).find((p) => p.id === id)

const labelOf = (node: GraphNode | undefined, fallback: string) => node?.label || fallback

const selfLoopAllowed = (options: WiringOptions) =>
  options.allowSelfLoop ?? (options.kind ?? 'cyclic') === 'cyclic'

/**
 * 沿着现有边找 from → to 的路径。
 *
 * 加一条边会不会成环，等价于「终点能不能走回起点」——所以从 to 出发找 from，
 * 而不是把边加进去再整图找环：整图找环报出来的是「图里有环」，
 * 说不出是刚连的这一条造成的。
 */
function pathBetween(document: GraphDocument, from: string, to: string): string[] | null {
  const next = new Map<string, string[]>()
  for (const edge of document.edges) {
    next.set(edge.from, [...(next.get(edge.from) ?? []), edge.to])
  }
  const stack: { id: string; trail: string[] }[] = [{ id: from, trail: [from] }]
  const seen = new Set<string>()
  while (stack.length) {
    const { id, trail } = stack.pop()!
    if (id === to && trail.length > 1) return trail
    if (seen.has(id)) continue
    seen.add(id)
    for (const child of next.get(id) ?? []) {
      stack.push({ id: child, trail: [...trail, child] })
    }
  }
  return null
}

/** 一条候选边自身的问题：端口、方向、类型、重复、自环 */
function candidateIssues(
  document: GraphDocument,
  candidate: EdgeCandidate,
  options: WiringOptions,
  ignoreEdgeId?: string
): EdgeIssue[] {
  const issues: EdgeIssue[] = []
  const id = candidate.id ?? '(新连线)'
  const fromNode = nodeOf(document, candidate.from)
  const toNode = nodeOf(document, candidate.to)

  for (const [end, nodeId, node] of [
    ['起点', candidate.from, fromNode],
    ['终点', candidate.to, toNode]
  ] as const) {
    if (!node) {
      issues.push({
        code: 'dangling',
        message: `连线 ${id} 的${end}节点 ${nodeId} 不存在`,
        target: `node:${nodeId}`,
        edgeId: candidate.id,
        nodeId
      })
    }
  }
  if (issues.length) return issues

  if (candidate.from === candidate.to && !selfLoopAllowed(options)) {
    issues.push({
      code: 'self-loop',
      message: `「${labelOf(fromNode, candidate.from)}」连回自己：这张图不允许自环`,
      target: `node:${candidate.from}`,
      edgeId: candidate.id,
      nodeId: candidate.from
    })
  }

  for (const [end, node, portId, side] of [
    ['起点', fromNode, candidate.fromPort, 'out'],
    ['终点', toNode, candidate.toPort, 'in']
  ] as const) {
    if (portId === undefined) continue
    const port = portOf(node, portId)
    if (!port) {
      issues.push({
        code: 'port-missing',
        message: `「${labelOf(node, '?')}」上没有端口 ${portId}`,
        target: `node:${node!.id}.port:${portId}`,
        edgeId: candidate.id,
        nodeId: node!.id,
        portId
      })
      continue
    }
    if (port.side !== side) {
      issues.push({
        code: 'direction',
        message:
          side === 'out'
            ? `端口 ${portId} 是入口，不能当连线的${end}`
            : `端口 ${portId} 是出口，不能当连线的${end}`,
        target: `node:${node!.id}.port:${portId}`,
        edgeId: candidate.id,
        nodeId: node!.id,
        portId
      })
      continue
    }
    const type = candidate.type
    if (side === 'in' && port.accepts && !port.accepts.includes(type ?? '')) {
      issues.push({
        code: 'type-mismatch',
        message: `端口 ${portId} 只收 ${port.accepts.join(' / ')}，收不了「${type ?? '未标类型'}」`,
        target: `node:${node!.id}.port:${portId}`,
        edgeId: candidate.id,
        nodeId: node!.id,
        portId
      })
    }
  }

  if (options.edgeTypes && candidate.type !== undefined && !options.edgeTypes.includes(candidate.type)) {
    issues.push({
      code: 'unknown-type',
      message: `连线类型「${candidate.type}」不在这张图允许的 ${options.edgeTypes.join(' / ')} 里`,
      target: candidate.id ? `edge:${candidate.id}` : `node:${candidate.from}`,
      edgeId: candidate.id
    })
  }

  const twin = document.edges.find(
    (e) =>
      e.id !== ignoreEdgeId &&
      e.from === candidate.from &&
      e.to === candidate.to &&
      (e.fromPort ?? '') === (candidate.fromPort ?? '') &&
      (e.toPort ?? '') === (candidate.toPort ?? '')
  )
  if (twin) {
    issues.push({
      code: 'duplicate',
      message: `这对端口之间已经有连线 ${twin.id}：第二条会与它完全重叠，看不出是两条`,
      target: `edge:${twin.id}`,
      edgeId: twin.id
    })
  }

  return issues
}

/** 环的检查要在候选边自身合法之后做，否则报出来的环里有不存在的节点 */
function cycleIssue(
  document: GraphDocument,
  candidate: EdgeCandidate,
  options: WiringOptions
): EdgeIssue | null {
  if ((options.kind ?? 'cyclic') !== 'dag') return null
  if (candidate.from === candidate.to) {
    return {
      code: 'cycle',
      message: `「${labelOf(nodeOf(document, candidate.from), candidate.from)}」连回自己：有向无环图里这是死循环`,
      target: `node:${candidate.from}`,
      edgeId: candidate.id,
      nodeId: candidate.from,
      cycle: [candidate.from, candidate.from]
    }
  }
  const back = pathBetween(document, candidate.to, candidate.from)
  if (!back) return null
  const trail = [...back, candidate.to]
  const labels = trail.map((id) => labelOf(nodeOf(document, id), id))
  return {
    code: 'cycle',
    message: `这条线会成环：${labels.join(' → ')}；有向无环图里这是死循环`,
    target: `node:${candidate.from}`,
    edgeId: candidate.id,
    nodeId: candidate.from,
    cycle: trail
  }
}

/** 连一条线。拒绝时给出可定位的问题，不留半截状态。 */
export function connectEdge(
  document: GraphDocument,
  candidate: EdgeCandidate,
  options: WiringOptions = {}
): WiringResult {
  const issues = candidateIssues(document, candidate, options)
  if (!issues.length) {
    const cycle = cycleIssue(document, candidate, options)
    if (cycle) issues.push(cycle)
  }
  if (issues.length) return { status: 'rejected', issues }

  const edge: GraphEdge = {
    id: candidate.id ?? nextEdgeId(),
    from: candidate.from,
    to: candidate.to,
    ...(candidate.fromPort !== undefined ? { fromPort: candidate.fromPort } : {}),
    ...(candidate.toPort !== undefined ? { toPort: candidate.toPort } : {}),
    ...(candidate.label !== undefined ? { label: candidate.label } : {}),
    ...(candidate.type !== undefined ? { type: candidate.type } : {})
  }
  return { status: 'ok', document: { ...document, edges: [...document.edges, edge] }, edge }
}

/** 断开一条线。断开永远成立——拦住删除只会让用户去改数据。 */
export function disconnectEdge(document: GraphDocument, edgeId: string): GraphDocument {
  return { ...document, edges: document.edges.filter((e) => e.id !== edgeId) }
}

/**
 * 重连：把已有的线换一个端。
 *
 * 不做成「先断后连」——中间那一步是一条悬空边，一旦新的一端不合法，
 * 用户手里剩下的是一张比原来更坏的图。这里要么整条换成新的，要么原图不动。
 */
export function reconnectEdge(
  document: GraphDocument,
  edgeId: string,
  patch: Partial<Pick<EdgeCandidate, 'from' | 'to' | 'fromPort' | 'toPort' | 'type' | 'label'>>,
  options: WiringOptions = {}
): WiringResult {
  const current = document.edges.find((e) => e.id === edgeId)
  if (!current) {
    return {
      status: 'rejected',
      issues: [
        {
          code: 'dangling',
          message: `没有 id 为 ${edgeId} 的连线`,
          target: `edge:${edgeId}`,
          edgeId
        }
      ]
    }
  }
  const candidate: EdgeCandidate = { ...current, ...patch, id: edgeId }
  const without = disconnectEdge(document, edgeId)
  const issues = candidateIssues(without, candidate, options, edgeId)
  if (!issues.length) {
    const cycle = cycleIssue(without, candidate, options)
    if (cycle) issues.push(cycle)
  }
  if (issues.length) return { status: 'rejected', issues }
  const edge: GraphEdge = { ...current, ...patch, id: edgeId }
  return {
    status: 'ok',
    document: { ...document, edges: document.edges.map((e) => (e.id === edgeId ? edge : e)) },
    edge
  }
}

/** 换连线类型走同一套校验：类型也决定了终点端口收不收它 */
export function setEdgeType(
  document: GraphDocument,
  edgeId: string,
  type: string,
  options: WiringOptions = {}
): WiringResult {
  return reconnectEdge(document, edgeId, { type }, options)
}

/**
 * 整图校验，给校验面板用。
 *
 * 逐条边报，而不是一见到问题就停：一次只修一条，用户要点很多次才知道
 * 到底有几处问题。成环只报一次——同一个环里的每条边都报一遍，
 * 面板上会出现十条说着同一件事的记录。
 */
export function validateWiring(document: GraphDocument, options: WiringOptions = {}): EdgeIssue[] {
  const issues: EdgeIssue[] = []
  const seenCycles = new Set<string>()
  const built: GraphDocument = { ...document, edges: [] }

  for (const edge of document.edges) {
    const own = candidateIssues(built, edge, options)
    // 重复边的两条都要能定位，所以保留 duplicate；其余按本条边报
    issues.push(...own)
    if (!own.length) {
      const cycle = cycleIssue(built, edge, options)
      if (cycle?.cycle) {
        const key = [...cycle.cycle].sort().join('>')
        if (!seenCycles.has(key)) {
          seenCycles.add(key)
          issues.push(cycle)
        }
      }
    }
    built.edges = [...built.edges, edge]
  }
  return issues
}

/**
 * 一条边当前是否可连，给画布拖拽时的即时反馈用。
 *
 * 拖到一半就变红比松手之后弹一句错误好：后者用户已经完成了动作，
 * 再撤销一次才回到原处。
 */
export function canConnect(
  document: GraphDocument,
  candidate: EdgeCandidate,
  options: WiringOptions = {}
): { ok: boolean; reason: string } {
  const result = connectEdge(document, candidate, options)
  if (result.status === 'ok') return { ok: true, reason: '' }
  return { ok: false, reason: result.issues[0]?.message ?? '连不上' }
}
