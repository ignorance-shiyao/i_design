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

/** 连线从节点的哪条边出入 */
export type FlowSide = 'top' | 'right' | 'bottom' | 'left'

export interface FlowEdge {
  from: string
  to: string
  label?: string
  /** 单条连线可以覆盖整图的默认走向 */
  type?: FlowEdgeType
  /**
   * 指定从起点的哪条边出去。不给就按两点方位自动选。
   *
   * 自动选在多数情况下是对的，但有两种图非指定不可：
   * 一是回边——「驳回」应当从侧面绕回去，自动选会让它贴着主干直上直下，
   * 和正向的线叠在一起；二是同一对节点之间的多条线，自动选会把它们全压成一条。
   */
  fromSide?: FlowSide
  /** 指定进入终点的哪条边。不给就按两点方位自动选 */
  toSide?: FlowSide
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
export function anchorOf(node: FlowNode, toward: { x: number; y: number }, side?: FlowSide) {
  const { w, h } = sizeOf(node)
  const c = centerOf(node)

  // 指定了就照办：指定的方向本身带着语义（回边走侧面、多线分开走），不该被自动判断推翻
  if (side) return { ...pointOnSide(node, side), side }

  const dx = toward.x - c.x
  const dy = toward.y - c.y

  // 主轴方向决定从哪条边出去：横向差距更大就走左右，否则走上下
  if (Math.abs(dx) * h > Math.abs(dy) * w) {
    return { x: dx > 0 ? node.x + w : node.x, y: c.y, side: dx > 0 ? 'right' : 'left' as const }
  }
  return { x: c.x, y: dy > 0 ? node.y + h : node.y, side: dy > 0 ? 'bottom' : 'top' as const }
}

/** 指定边的中点 */
function pointOnSide(node: FlowNode, side: FlowSide) {
  const { w, h } = sizeOf(node)
  const c = centerOf(node)
  if (side === 'left') return { x: node.x, y: c.y }
  if (side === 'right') return { x: node.x + w, y: c.y }
  if (side === 'top') return { x: c.x, y: node.y }
  return { x: c.x, y: node.y + h }
}

/**
 * 正交连线：先沿出边方向走一段，再拐向目标。
 *
 * 用直角折线而不是直连斜线：流程图里斜线穿过其他节点时很难辨认走向，
 * 而直角折线的每一段都平行于画布，视线可以顺着走。
 */
export function edgePath(
  from: FlowNode,
  to: FlowNode,
  type: FlowEdgeType = 'polyline',
  sides: { from?: FlowSide; to?: FlowSide } = {}
) {
  const a = anchorOf(from, centerOf(to), sides.from)
  const b = anchorOf(to, centerOf(from), sides.to)
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
export function edgeMidpoint(
  from: FlowNode,
  to: FlowNode,
  type: FlowEdgeType = 'polyline',
  sides: { from?: FlowSide; to?: FlowSide } = {}
) {
  const a = anchorOf(from, centerOf(to), sides.from)
  const b = anchorOf(to, centerOf(from), sides.to)
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

/* ---------- 框选 ---------- */

export interface FlowRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 由按下点与当前点算出框选矩形。
 *
 * 两点顺序不做要求：往左上拖也是合法的框选，
 * 不归一化的话宽高会变成负数，命中判定与描边都会失效。
 */
export function marqueeRect(a: { x: number; y: number }, b: { x: number; y: number }): FlowRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y)
  }
}

/**
 * 框选命中的节点。
 *
 * 默认 contain（整个节点都在框内才算中）而不是 intersect：
 * 相交判定下，框边缘扫过的节点会被顺手选中，
 * 用户拖框经过一个节点却没打算选它，是最常见的误操作。
 */
export function nodesInRect(
  nodes: FlowNode[],
  rect: FlowRect,
  mode: 'contain' | 'intersect' = 'contain'
): string[] {
  const right = rect.x + rect.width
  const bottom = rect.y + rect.height
  return nodes
    .filter((node) => {
      const { w, h } = sizeOf(node)
      if (mode === 'intersect') {
        return node.x < right && node.x + w > rect.x && node.y < bottom && node.y + h > rect.y
      }
      return node.x >= rect.x && node.y >= rect.y && node.x + w <= right && node.y + h <= bottom
    })
    .map((node) => node.id)
}

/**
 * 批量移动：整组一起吸附，而不是各自吸附。
 *
 * 逐个吸附会把组里原本的相对间距抹平——两个相距 12px 的节点，
 * 各自对齐到 8 格后可能变成 8px 或 16px，一次批量移动就把手工排好的版毁了。
 * 因此位移量本身吸附一次，组内所有节点用同一个位移。
 */
export function moveNodes(
  nodes: FlowNode[],
  ids: string[],
  delta: { x: number; y: number },
  grid = 8
): { id: string; x: number; y: number }[] {
  const picked = new Set(ids)
  const dx = grid > 0 ? Math.round(delta.x / grid) * grid : delta.x
  const dy = grid > 0 ? Math.round(delta.y / grid) * grid : delta.y
  return nodes
    .filter((node) => picked.has(node.id))
    .map((node) => ({ id: node.id, x: node.x + dx, y: node.y + dy }))
}

/* ---------- 节点分组 ---------- */

export interface FlowGroup {
  id: string
  label: string
  /** 组内节点。不在 `nodes` 里的 id 会被忽略，组随之变小而不是崩掉 */
  nodeIds: string[]
  /** 折叠后组内节点收成一个方块 */
  collapsed?: boolean
}

/** 组框的边界：包住组内所有节点，再留一圈让标题有地方放 */
export function groupBounds(nodes: FlowNode[], group: FlowGroup, padding = 16): FlowRect | null {
  const members = nodes.filter((n) => group.nodeIds.includes(n.id))
  if (!members.length) return null
  const xs = members.map((n) => n.x)
  const ys = members.map((n) => n.y)
  const rights = members.map((n) => n.x + (n.width ?? NODE_W))
  const bottoms = members.map((n) => n.y + (n.height ?? NODE_H))
  const x = Math.min(...xs) - padding
  // 顶上多留一截给标题：标题压在第一个节点上，读者会以为那是节点自己的字
  const y = Math.min(...ys) - padding - 18
  return {
    x,
    y,
    width: Math.max(...rights) + padding - x,
    height: Math.max(...bottoms) + padding - y
  }
}

/**
 * 折叠之后画布上还剩哪些节点。
 *
 * 折叠组里的成员换成一个代表节点——不是把它们藏起来就完事：连到组内的线
 * 得有个落点，否则那些线会指向空气。代表节点沿用组的 id，
 * 于是「连到这个组」和「连到组里某一个」在渲染时是同一件事。
 */
export function visibleNodes(nodes: FlowNode[], groups: FlowGroup[] = []): FlowNode[] {
  const collapsed = groups.filter((g) => g.collapsed)
  if (!collapsed.length) return nodes

  const hidden = new Set(collapsed.flatMap((g) => g.nodeIds))
  const out = nodes.filter((n) => !hidden.has(n.id))
  for (const group of collapsed) {
    const box = groupBounds(nodes, group, 0)
    if (!box) continue
    out.push({
      id: group.id,
      // 折成一块的位置取组的中上部，读者视线仍落在原来那片区域
      x: box.x,
      y: box.y,
      width: Math.max(NODE_W, Math.min(box.width, 220)),
      height: NODE_H,
      label: `${group.label} · ${group.nodeIds.length}`,
      type: 'process'
    })
  }
  return out
}

/**
 * 折叠之后还剩哪些连线。
 *
 * 两件事：**端点落在被折叠成员上的线改指向组**，**两端都在同一个折叠组里的线直接去掉**——
 * 后者画出来是一条从组连回自己的自环，除了噪声什么也不说明。
 * 重定向之后可能出现多条一模一样的线（组内三个节点都连向外面同一个节点），去重。
 */
export function visibleEdges(edges: FlowEdge[], groups: FlowGroup[] = []): FlowEdge[] {
  const collapsed = groups.filter((g) => g.collapsed)
  if (!collapsed.length) return edges

  const owner = new Map<string, string>()
  for (const group of collapsed) for (const id of group.nodeIds) owner.set(id, group.id)

  const seen = new Set<string>()
  const out: FlowEdge[] = []
  for (const edge of edges) {
    const from = owner.get(edge.from) ?? edge.from
    const to = owner.get(edge.to) ?? edge.to
    if (from === to) continue
    const key = `${from}->${to}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(from === edge.from && to === edge.to ? edge : { ...edge, from, to })
  }
  return out
}

/* ---------- 对齐辅助线 ---------- */

/** 一条辅助线。`span` 是它要画多长——只盖住参与对齐的那几个节点 */
export interface FlowGuide {
  /** v 是竖线（左右对齐），h 是横线（上下对齐） */
  orientation: 'v' | 'h'
  /** 竖线的 x 或横线的 y */
  at: number
  /** 线的起止，沿另一根轴 */
  from: number
  to: number
}

/** 一个节点在某根轴上的三条对齐线：起边、中心、止边 */
function linesOf(node: FlowNode, axis: 'x' | 'y') {
  const start = axis === 'x' ? node.x : node.y
  const size = (axis === 'x' ? node.width : node.height) ?? (axis === 'x' ? 120 : 48)
  return [
    { kind: 'start' as const, at: start },
    { kind: 'center' as const, at: start + size / 2 },
    { kind: 'end' as const, at: start + size }
  ]
}

const spanOf = (node: FlowNode, axis: 'x' | 'y') => {
  const start = axis === 'x' ? node.x : node.y
  const size = (axis === 'x' ? node.width : node.height) ?? (axis === 'x' ? 120 : 48)
  return [start, start + size] as const
}

/**
 * 拖动时的对齐辅助线与吸附量。
 *
 * 手动把两个节点对齐是件很折磨人的事：差一两个像素看得出来，却怎么也拖不准。
 * 辅助线把「已经对齐了」这件事说出来，吸附再把最后那一两像素替用户走完。
 *
 * 三条取舍：
 *
 * 1. **中心优先于边**。两个节点中心对齐时，即使宽度不同看起来也是齐的；
 *    按边对齐则会在宽度不同时显得歪。所以同样距离内先吸中心。
 * 2. **每根轴只吸一条**。同时吸左边和中心是自相矛盾的，取最近的那条。
 * 3. **线只画到参与对齐的节点为止**，不贯穿整张画布。贯穿全画布的线在节点多的图上
 *    会像一张网格，反而看不出是哪两个节点对齐了。
 *
 * 阈值用画布坐标，调用方按缩放比例换算——缩小到 50% 时，屏幕上的 6px 是画布上的 12px，
 * 不换算的话图缩得越小越难吸上。
 */
export function alignGuides(
  moving: FlowNode,
  others: FlowNode[],
  threshold = 6
): { dx: number; dy: number; guides: FlowGuide[] } {
  const guides: FlowGuide[] = []
  let dx = 0
  let dy = 0

  for (const axis of ['x', 'y'] as const) {
    const mine = linesOf(moving, axis)
    let best: { delta: number; at: number; center: boolean; other: FlowNode } | null = null

    for (const other of others) {
      if (other.id === moving.id) continue
      for (const line of linesOf(other, axis)) {
        for (const own of mine) {
          const delta = line.at - own.at
          if (Math.abs(delta) > threshold) continue
          const center = own.kind === 'center' && line.kind === 'center'
          if (
            !best ||
            Math.abs(delta) < Math.abs(best.delta) ||
            // 同样近时中心赢：宽度不同的两个节点，中心对齐才看着是齐的
            (Math.abs(delta) === Math.abs(best.delta) && center && !best.center)
          ) {
            best = { delta, at: line.at, center, other }
          }
        }
      }
    }

    if (!best) continue
    if (axis === 'x') dx = best.delta
    else dy = best.delta

    /*
     * 吸附量定下来之后，把这一位移下**所有**真正重合的线都画出来。
     * 左边、中心、右边同时对齐时只画一条，读者会以为只有那一处齐了；
     * 三条都画出来，「这两个节点完全对齐」才说得清楚。
     */
    const cross = axis === 'x' ? 'y' : 'x'
    const [a1, a2] = spanOf(moving, cross)
    const seen = new Set<number>()
    for (const other of others) {
      if (other.id === moving.id) continue
      const [b1, b2] = spanOf(other, cross)
      for (const line of linesOf(other, axis)) {
        for (const own of linesOf(moving, axis)) {
          if (line.at - own.at !== best.delta) continue
          if (seen.has(line.at)) continue
          seen.add(line.at)
          guides.push({
            orientation: axis === 'x' ? 'v' : 'h',
            at: line.at,
            from: Math.min(a1, b1),
            to: Math.max(a2, b2)
          })
        }
      }
    }
  }

  return { dx, dy, guides }
}

/* ---------- 节点缩放 ---------- */

/** 缩放手柄的位置。只放四个角：边中点手柄在小节点上会和角手柄挤在一起 */
export type FlowResizeHandle = 'nw' | 'ne' | 'se' | 'sw'

export const MIN_NODE_W = 72
export const MIN_NODE_H = 32

/**
 * 拖动某个角把节点缩放到指针位置。
 *
 * 对角固定不动：拖右下角时左上角不该跟着跑，否则节点会一边变大一边平移，
 * 手感像在拖整个节点而不是在改尺寸。
 * 尺寸下限之外还要夹住位置——只夹尺寸的话，拖过头时节点会继续往反方向滑。
 */
export function resizeNode(
  node: FlowNode,
  handle: FlowResizeHandle,
  point: { x: number; y: number },
  { grid = 8, minWidth = MIN_NODE_W, minHeight = MIN_NODE_H } = {}
): { x: number; y: number; width: number; height: number } {
  const { w, h } = sizeOf(node)
  const snap = (v: number) => (grid > 0 ? Math.round(v / grid) * grid : v)
  const left = node.x
  const top = node.y
  const right = node.x + w
  const bottom = node.y + h

  const west = handle === 'nw' || handle === 'sw'
  const north = handle === 'nw' || handle === 'ne'

  // 固定对角，另一角跟指针走
  const anchorX = west ? right : left
  const anchorY = north ? bottom : top
  let movingX = snap(point.x)
  let movingY = snap(point.y)

  if (west) movingX = Math.min(movingX, anchorX - minWidth)
  else movingX = Math.max(movingX, anchorX + minWidth)
  if (north) movingY = Math.min(movingY, anchorY - minHeight)
  else movingY = Math.max(movingY, anchorY + minHeight)

  return {
    x: Math.min(anchorX, movingX),
    y: Math.min(anchorY, movingY),
    width: Math.abs(anchorX - movingX),
    height: Math.abs(anchorY - movingY)
  }
}

/* ---------- 缩略图 ---------- */

export interface FlowView {
  x: number
  y: number
  scale: number
}

export interface MinimapLayout {
  /** 画布坐标 → 缩略图坐标的缩放比 */
  scale: number
  /** 缩略图内的居中偏移 */
  offsetX: number
  offsetY: number
  /** 当前视口对应到缩略图上的取景框 */
  viewport: FlowRect
}

/**
 * 缩略图布局。
 *
 * 横纵取较小的比例并居中，而不是各自拉伸：分别缩放会让缩略图里的节点
 * 与主画布长宽比不同，那样缩略图就不再是同一张图的缩小版，指路作用也就没了。
 */
export function minimapLayout(
  nodes: FlowNode[],
  view: FlowView,
  canvas: { width: number; height: number },
  minimap: { width: number; height: number },
  padding = 40
): MinimapLayout {
  const bounds = boundsOf(nodes, padding)
  const scale = Math.min(minimap.width / bounds.width, minimap.height / bounds.height)
  const offsetX = (minimap.width - bounds.width * scale) / 2 - bounds.x * scale
  const offsetY = (minimap.height - bounds.height * scale) / 2 - bounds.y * scale

  // 视口在画布坐标里的位置：屏幕原点反算回去，再按缩略图比例投影
  const viewX = -view.x / view.scale
  const viewY = -view.y / view.scale
  return {
    scale,
    offsetX,
    offsetY,
    viewport: {
      x: viewX * scale + offsetX,
      y: viewY * scale + offsetY,
      width: (canvas.width / view.scale) * scale,
      height: (canvas.height / view.scale) * scale
    }
  }
}

/**
 * 点击缩略图某处，算出让该点居中所需的主画布视图。
 *
 * 这是 minimapLayout 的逆运算——缩略图上点一下就跳过去，
 * 是大图导航里唯一比拖滚动条快的操作。
 */
export function viewFromMinimap(
  point: { x: number; y: number },
  layout: MinimapLayout,
  view: FlowView,
  canvas: { width: number; height: number }
): FlowView {
  const canvasX = (point.x - layout.offsetX) / layout.scale
  const canvasY = (point.y - layout.offsetY) / layout.scale
  return {
    scale: view.scale,
    x: canvas.width / 2 - canvasX * view.scale,
    y: canvas.height / 2 - canvasY * view.scale
  }
}

/* ---------- 快照导出 ---------- */

/**
 * 导出用的 viewBox：包住全部节点，与当前视口无关。
 *
 * 导出的是「这张图」，不是「我现在看到的这一块」——
 * 按当前视口导出，用户拿到的图会缺掉他没滚动到的部分，而他并不会察觉。
 */
export function snapshotViewBox(nodes: FlowNode[], padding = 24): FlowRect {
  return boundsOf(nodes, padding)
}

/**
 * 给导出的 SVG 拼一份内联样式表。
 *
 * SVG 一旦脱离页面就拿不到 CSS 变量了：直接序列化 DOM 得到的文件，
 * 所有 var(--i-color-*) 全部落空，节点变成黑色无填充的框。
 * 因此把令牌以字面值写进 <style>，导出的文件在任何地方打开都一样。
 *
 * 整表写入而不是挑几个用得上的：白名单会随组件改动悄悄失配——
 * 组件里换用一个没列进来的令牌，导出的图就少一块颜色，而构建照样是绿的。
 * 整表也不过几 KB，远不值得为省这点体积换一个不会报错的缺陷。
 */
export function snapshotStyle(tokens: Record<string, string>, prefix = 'i'): string {
  const declarations = Object.entries(tokens)
    .map(([key, value]) => `  --${prefix}-${key}: ${value};`)
    .join('\n')
  return `:root {\n${declarations}\n}`
}
