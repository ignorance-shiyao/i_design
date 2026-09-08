/**
 * 流程图的几何计算：连线走向、包围盒与自动分层。
 *
 * 与渲染无关的部分全在这里——Web 端拿它生成 SVG 路径，其他端拿它算画布坐标。
 * 「同一张流程图在两个端上连线绕法不同」因此不会发生。
 */

export interface FlowNode {
  id: string
  x: number
  y: number
  width?: number
  height?: number
  label: string
  /** 形状语义：开始/结束是圆角胶囊，判断是菱形，其余是矩形 */
  type?: 'start' | 'process' | 'decision' | 'end'
}

/**
 * 连线走向。
 *
 *   polyline  正交折线（默认）——每段都平行于画布，视线能顺着走，最适合审批流
 *   straight  直连——节点少、彼此不遮挡时最省视觉噪声
 *   bezier    曲线——同一对节点之间有多条连线，或图偏「关系网」而非「流程」时更好读
 */
export type FlowEdgeType = 'polyline' | 'straight' | 'bezier'

export interface FlowEdge {
  from: string
  to: string
  label?: string
  /** 单条连线可以覆盖整图的默认走向 */
  type?: FlowEdgeType
}

export const NODE_W = 132
export const NODE_H = 48

const sizeOf = (node: FlowNode) => ({
  w: node.width ?? NODE_W,
  h: node.height ?? NODE_H
})

/** 节点中心点 */
export function centerOf(node: FlowNode) {
  const { w, h } = sizeOf(node)
  return { x: node.x + w / 2, y: node.y + h / 2 }
}

/**
 * 连线端点吸附到节点边缘的中点，而不是节点中心。
 * 连到中心会让箭头钻进节点里，被节点自己的填充盖住。
 */
export function anchorOf(node: FlowNode, toward: { x: number; y: number }) {
  const { w, h } = sizeOf(node)
  const c = centerOf(node)
  const dx = toward.x - c.x
  const dy = toward.y - c.y

  // 主轴方向决定从哪条边出去：横向差距更大就走左右，否则走上下
  if (Math.abs(dx) * h > Math.abs(dy) * w) {
    return { x: dx > 0 ? node.x + w : node.x, y: c.y, side: dx > 0 ? 'right' : 'left' as const }
  }
  return { x: c.x, y: dy > 0 ? node.y + h : node.y, side: dy > 0 ? 'bottom' : 'top' as const }
}

/**
 * 正交连线：先沿出边方向走一段，再拐向目标。
 *
 * 用直角折线而不是直连斜线：流程图里斜线穿过其他节点时很难辨认走向，
 * 而直角折线的每一段都平行于画布，视线可以顺着走。
 */
export function edgePath(from: FlowNode, to: FlowNode, type: FlowEdgeType = 'polyline') {
  const a = anchorOf(from, centerOf(to))
  const b = anchorOf(to, centerOf(from))
  const gap = 18

  if (type === 'straight') return `M${a.x} ${a.y} L${b.x} ${b.y}`

  if (type === 'bezier') {
    /*
     * 控制点是「端点沿它自己那条边的法线向外推一段」。
     *
     * 不用两点中线做控制点：那样曲线会贴着节点边缘切出去，
     * 箭头进出的方向和锚点所在的边对不上，读者看不出线是从哪条边接出来的。
     * 推出的距离取两点间距的一半并设上下限——距离近时不至于甩出大圈，
     * 距离远时也仍有明显弧度。
     */
    const dist = Math.hypot(b.x - a.x, b.y - a.y)
    const push = Math.min(120, Math.max(32, dist / 2))
    const c1 = offsetBySide(a, push)
    const c2 = offsetBySide(b, push)
    return `M${a.x} ${a.y} C${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`
  }

  if (a.side === 'bottom' || a.side === 'top') {
    const midY = (a.y + b.y) / 2
    return `M${a.x} ${a.y} L${a.x} ${midY} L${b.x} ${midY} L${b.x} ${b.y}`
  }
  const midX = a.side === 'right' ? Math.max(a.x + gap, (a.x + b.x) / 2) : Math.min(a.x - gap, (a.x + b.x) / 2)
  return `M${a.x} ${a.y} L${midX} ${a.y} L${midX} ${b.y} L${b.x} ${b.y}`
}

/** 端点沿所在边的法线向外推：控制点必须在节点外侧，否则曲线会穿回节点里 */
function offsetBySide(point: { x: number; y: number; side: string }, distance: number) {
  if (point.side === 'left') return { x: point.x - distance, y: point.y }
  if (point.side === 'right') return { x: point.x + distance, y: point.y }
  if (point.side === 'top') return { x: point.x, y: point.y - distance }
  return { x: point.x, y: point.y + distance }
}

/**
 * 连线中点，用来放标签。
 *
 * 曲线要按三次贝塞尔在 t=0.5 处求值，而不是取两端点中点——
 * 弧度大时中点会离曲线很远，标签飘在空白处。
 */
export function edgeMidpoint(from: FlowNode, to: FlowNode, type: FlowEdgeType = 'polyline') {
  const a = anchorOf(from, centerOf(to))
  const b = anchorOf(to, centerOf(from))
  if (type !== 'bezier') return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const dist = Math.hypot(b.x - a.x, b.y - a.y)
  const push = Math.min(120, Math.max(32, dist / 2))
  const c1 = offsetBySide(a, push)
  const c2 = offsetBySide(b, push)
  // t=0.5 的三次贝塞尔：(P0 + 3P1 + 3P2 + P3) / 8
  return {
    x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8,
    y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8
  }
}

/** 所有节点的包围盒，用于「适应画布」 */
export function boundsOf(nodes: FlowNode[], padding = 40) {
  if (!nodes.length) return { x: 0, y: 0, width: 1, height: 1 }
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const rights = nodes.map((n) => n.x + (n.width ?? NODE_W))
  const bottoms = nodes.map((n) => n.y + (n.height ?? NODE_H))
  const x = Math.min(...xs) - padding
  const y = Math.min(...ys) - padding
  return {
    x,
    y,
    width: Math.max(...rights) + padding - x,
    height: Math.max(...bottoms) + padding - y
  }
}

/**
 * 自动分层：按依赖深度排层，同层横向铺开。
 *
 * 调用方给出节点与连线即可得到一张可读的图，不必手填坐标；
 * 手工调整过位置的节点传 x/y 即可，这里只填未定位的。
 */
export function autoLayout(
  nodes: Omit<FlowNode, 'x' | 'y'>[],
  edges: FlowEdge[],
  { gapX = 200, gapY = 96, direction = 'vertical' as 'vertical' | 'horizontal' } = {}
): FlowNode[] {
  /*
   * 深度 = 从入口出发的最长路径，但要跳过回边。
   *
   * 审批流里「驳回 → 重新填写」是回边：顺着它继续推深度，会让整张图一层层往下漂，
   * 层数变成节点数那么多。这里沿路径记录已访问节点，遇到回到自身路径上的边就停，
   * 于是环上的节点仍然按它第一次被到达的深度落位。
   */
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  for (const node of nodes) {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  }
  for (const edge of edges) {
    outgoing.get(edge.from)?.push(edge.to)
    incoming.get(edge.to)?.push(edge.from)
  }

  const depth = new Map<string, number>()
  for (const node of nodes) depth.set(node.id, 0)

  // 入口：没有入边的节点；整张图都在环里时退回第一个节点，总得有个起点
  const roots = nodes.filter((n) => (incoming.get(n.id) ?? []).length === 0).map((n) => n.id)
  const stack: { id: string; d: number; path: Set<string> }[] = (roots.length ? roots : [nodes[0]?.id]).
    filter(Boolean).
    map((id) => ({ id: id as string, d: 0, path: new Set([id as string]) }))

  // 步数上限：极端稠密图上防止路径枚举失控，超过就用当前结果
  let steps = 0
  const LIMIT = 20000
  while (stack.length && steps++ < LIMIT) {
    const { id, d, path } = stack.pop()!
    if (d > (depth.get(id) ?? 0)) depth.set(id, d)
    for (const next of outgoing.get(id) ?? []) {
      if (path.has(next)) continue
      // 复制路径而不是展开迭代：使用方的 TS 目标可能低于 ES2015，展开 Set 会编译失败
      const nextPath = new Set<string>()
      path.forEach((v) => nextPath.add(v))
      nextPath.add(next)
      stack.push({ id: next, d: d + 1, path: nextPath })
    }
  }

  const layers = new Map<number, string[]>()
  for (const node of nodes) {
    const d = depth.get(node.id) ?? 0
    layers.set(d, [...(layers.get(d) ?? []), node.id])
  }

  return nodes.map((node) => {
    const d = depth.get(node.id) ?? 0
    const row = layers.get(d) ?? []
    const index = row.indexOf(node.id)
    // 同层居中对齐：奇数个时中间那个正对上一层
    const offset = (index - (row.length - 1) / 2) * gapX
    return direction === 'vertical'
      ? { ...node, x: 240 + offset, y: 40 + d * gapY }
      : { ...node, x: 40 + d * gapX, y: 200 + offset }
  })
}
