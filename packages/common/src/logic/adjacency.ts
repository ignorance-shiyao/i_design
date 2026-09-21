/**
 * 邻接矩阵的口径契约（astra.md 的 D08）。
 *
 * 这张图回答的是「谁连着谁、连得有多重」。和留存、断流一样，
 * 最危险的不是算错，而是把「没有数据」画成「数据是 0」——
 * 空格子涂成最浅一档，读者会以为「几乎没关系」，其实根本没测过。
 *
 * 三件事定死：
 *
 * **一、空格有两种，都不是 0。**
 * - `absent`：确认没有边（结构上不相连）。值 null，画成空格，不是 0。
 * - `unknown`：没统计到（观测缺失）。值 null，画成空格并带「未观测」标记，不是 0。
 * - `ready` 且值为 0：确认有边，权重就是 0（例如计数边恰好零次）。
 * 三种在图上必须能分开——否则「没边」「没测到」「权重为零」会被读成同一件事。
 *
 * **二、排序口径显式写在模型上，不偷偷重排。**
 * - `input`：按输入顺序
 * - `degree`：按度数（出度 + 入度）降序，同分保留输入序
 * - `community`：按社群 id 字典序，同社群内保留输入序；没有社群的排在最后
 * 调用方必须选一种；模型上的 `sort` 与 `basis` 必须显示在图上。
 *
 * **三、有向 / 无向写死。**
 * 无向时 (i,j) 与 (j,i) 同值同状态；对角线默认 `absent`（除非显式自环）。
 * 同一对节点多条边：后写覆盖前写（与实时滑窗同一 id 去重同理），并记入 excluded。
 */

export type AdjacencySort = 'input' | 'degree' | 'community'

export type AdjacencyCellState = 'ready' | 'absent' | 'unknown'

export interface AdjacencyNodeInput {
  id: string
  label: string
  /** 社群 / 分区。community 排序时用；缺失的排在最后 */
  community?: string | null
}

export interface AdjacencyEdgeInput {
  from: string
  to: string
  /**
   * 边权。
   * - 有限数 → ready
   * - null 或省略且 `unknown: true` → unknown（观测到这对，但权重未知）
   * - 根本不出现在边表里 → absent（确认没边）
   */
  weight?: number | null
  /** 显式声明「没统计到」。与 weight: null 等价，写出来更不容易被误读成 0 */
  unknown?: boolean
}

export interface AdjacencyCell {
  rowId: string
  columnId: string
  rowIndex: number
  columnIndex: number
  state: AdjacencyCellState
  /** ready 时为权重；absent / unknown 时恒为 null——空格不是 0 */
  value: number | null
  valueText: string
  description: string
}

export interface AdjacencyNode {
  id: string
  label: string
  community: string | null
  /** 在排序后的行列中的下标 */
  index: number
  /** 输入顺序，稳定排序的次键 */
  sourceIndex: number
  /** 出度 + 入度（自环计一次） */
  degree: number
  degreeText: string
}

export interface AdjacencyModel {
  version: 1
  state: 'ready' | 'empty' | 'invalid'
  directed: boolean
  sort: AdjacencySort
  nodes: AdjacencyNode[]
  /** 行优先：cells[row][col] */
  cells: AdjacencyCell[][]
  /** ready 单元格里的最小 / 最大权重，供色阶使用；没有 ready 时为 null */
  min: number | null
  max: number | null
  /** 口径说明，必须显示在图上 */
  basis: string
  unit: string
  caption: string
  excluded: { id: string; reason: string; sourceIndex: number }[]
  /** 三种状态各有多少格——空格计数进 absent / unknown，不进 ready */
  counts: { ready: number; absent: number; unknown: number }
}

export interface AdjacencyOptions {
  /** 有向图。默认 false（无向） */
  directed?: boolean
  /** 排序口径。必须显式传入，不默认偷偷按度数重排 */
  sort: AdjacencySort
  unit?: string
}

const BASIS: Record<AdjacencySort, string> = {
  input: '行列按输入顺序；空格是没有边或未观测，不是 0；权重为 0 的边会画成 0',
  degree: '行列按度数降序（同分保留输入序）；空格是没有边或未观测，不是 0',
  community: '行列按社群字典序（无社群在最后，同社群保留输入序）；空格是没有边或未观测，不是 0'
}

const numberText = (n: number, unit: string) => {
  const text =
    n !== 0 && Math.abs(n) < 0.000001
      ? n.toExponential(3)
      : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 6 }).format(n)
  return `${text}${unit}`
}

function invalid(base: AdjacencyModel, caption: string): AdjacencyModel {
  return {
    ...base,
    state: 'invalid',
    nodes: [],
    cells: [],
    min: null,
    max: null,
    caption,
    counts: { ready: 0, absent: 0, unknown: 0 }
  }
}

/**
 * 把节点与边收成一份可直接渲染的邻接矩阵。
 *
 * 不修改入参。空格（absent / unknown）的 value 恒为 null，不会写成 0。
 */
export function buildAdjacency(
  nodeInput: readonly AdjacencyNodeInput[],
  edgeInput: readonly AdjacencyEdgeInput[],
  options: AdjacencyOptions
): AdjacencyModel {
  const unit = options.unit ?? ''
  const directed = Boolean(options.directed)
  const sort = options.sort
  const base: AdjacencyModel = {
    version: 1,
    state: 'empty',
    directed,
    sort,
    nodes: [],
    cells: [],
    min: null,
    max: null,
    basis: BASIS[sort] ?? '',
    unit,
    caption: '',
    excluded: [],
    counts: { ready: 0, absent: 0, unknown: 0 }
  }

  if (sort !== 'input' && sort !== 'degree' && sort !== 'community') {
    return invalid(base, '排序口径必须是 input / degree / community 之一，不能省略或自创')
  }

  const excluded: AdjacencyModel['excluded'] = []
  const nodeMap = new Map<string, { node: AdjacencyNodeInput; sourceIndex: number }>()

  nodeInput.forEach((node, sourceIndex) => {
    if (!node.id) {
      excluded.push({ id: `node-${sourceIndex}`, reason: '节点 ID 不能为空', sourceIndex })
      return
    }
    if (!node.label) {
      excluded.push({ id: node.id, reason: '节点缺少标签，图上无法读出是谁', sourceIndex })
      return
    }
    if (nodeMap.has(node.id)) {
      excluded.push({ id: node.id, reason: '节点 ID 重复，后出现的被忽略', sourceIndex })
      return
    }
    nodeMap.set(node.id, { node, sourceIndex })
  })

  if (nodeMap.size === 0) {
    return {
      ...base,
      state: 'empty',
      excluded,
      caption: '没有可画的节点',
      basis: BASIS[sort]
    }
  }

  type Slot = { state: AdjacencyCellState; value: number | null; sourceIndex: number }
  const slots = new Map<string, Slot>()
  const edgeKey = (from: string, to: string) => `${from}\0${to}`

  const writeSlot = (from: string, to: string, slot: Slot) => {
    const key = edgeKey(from, to)
    const prev = slots.get(key)
    if (prev) {
      excluded.push({
        id: `${from}->${to}`,
        reason: '同一对节点出现多条边，后写覆盖前写',
        sourceIndex: slot.sourceIndex
      })
    }
    slots.set(key, slot)
    if (!directed && from !== to) {
      const mirror = edgeKey(to, from)
      const mirrorPrev = slots.get(mirror)
      if (mirrorPrev && mirrorPrev.sourceIndex !== slot.sourceIndex) {
        excluded.push({
          id: `${to}->${from}`,
          reason: '无向图镜像边与已有边冲突，后写覆盖前写',
          sourceIndex: slot.sourceIndex
        })
      }
      slots.set(mirror, slot)
    }
  }

  edgeInput.forEach((edge, sourceIndex) => {
    if (!edge.from || !edge.to) {
      excluded.push({ id: `edge-${sourceIndex}`, reason: '边的两端 ID 不能为空', sourceIndex })
      return
    }
    if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) {
      excluded.push({
        id: `${edge.from}->${edge.to}`,
        reason: '边的端点不在节点表里，整条边未计入',
        sourceIndex
      })
      return
    }
    const unknown = edge.unknown === true || edge.weight === null
    if (unknown) {
      writeSlot(edge.from, edge.to, { state: 'unknown', value: null, sourceIndex })
      return
    }
    if (edge.weight === undefined) {
      // 出现在边表里却没给权重、也没标 unknown：当作权重 1 的存在边
      writeSlot(edge.from, edge.to, { state: 'ready', value: 1, sourceIndex })
      return
    }
    if (!Number.isFinite(edge.weight)) {
      excluded.push({
        id: `${edge.from}->${edge.to}`,
        reason: '边权不是有效的数（缺失请传 null 或 unknown: true，不是 NaN）',
        sourceIndex
      })
      return
    }
    writeSlot(edge.from, edge.to, { state: 'ready', value: edge.weight, sourceIndex })
  })

  // 度数：ready / unknown 边计 1；absent 不计。
  // 无向图 slots 里一对节点有两个方向，各给 from +1，正好是无向度数。
  // 有向图只存一个方向，给 from +1、to +1，即出度 + 入度。
  const degree = new Map<string, number>()
  for (const id of nodeMap.keys()) degree.set(id, 0)
  for (const [key, slot] of slots) {
    if (slot.state === 'absent') continue
    const [from, to] = key.split('\0')
    degree.set(from, (degree.get(from) ?? 0) + 1)
    if (directed && from !== to) {
      degree.set(to, (degree.get(to) ?? 0) + 1)
    }
  }

  const rawNodes = [...nodeMap.values()]
  rawNodes.sort((a, b) => {
    if (sort === 'degree') {
      const d = (degree.get(b.node.id) ?? 0) - (degree.get(a.node.id) ?? 0)
      if (d !== 0) return d
      return a.sourceIndex - b.sourceIndex
    }
    if (sort === 'community') {
      const ca = a.node.community ?? null
      const cb = b.node.community ?? null
      if (ca === null && cb !== null) return 1
      if (ca !== null && cb === null) return -1
      if (ca !== null && cb !== null && ca !== cb) return ca < cb ? -1 : 1
      return a.sourceIndex - b.sourceIndex
    }
    return a.sourceIndex - b.sourceIndex
  })

  const nodes: AdjacencyNode[] = rawNodes.map((row, index) => ({
    id: row.node.id,
    label: row.node.label,
    community: row.node.community ?? null,
    index,
    sourceIndex: row.sourceIndex,
    degree: degree.get(row.node.id) ?? 0,
    degreeText: String(degree.get(row.node.id) ?? 0)
  }))

  const counts = { ready: 0, absent: 0, unknown: 0 }
  let min: number | null = null
  let max: number | null = null
  const cells: AdjacencyCell[][] = nodes.map((row, rowIndex) =>
    nodes.map((col, columnIndex) => {
      const slot = slots.get(edgeKey(row.id, col.id))
      if (!slot) {
        counts.absent += 1
        return {
          rowId: row.id,
          columnId: col.id,
          rowIndex,
          columnIndex,
          state: 'absent' as const,
          value: null,
          valueText: '—',
          description: `${row.label} → ${col.label}：没有边，不是 0`
        }
      }
      if (slot.state === 'unknown') {
        counts.unknown += 1
        return {
          rowId: row.id,
          columnId: col.id,
          rowIndex,
          columnIndex,
          state: 'unknown' as const,
          value: null,
          valueText: '—',
          description: `${row.label} → ${col.label}：未观测到，不是 0`
        }
      }
      const value = slot.value as number
      counts.ready += 1
      min = min === null ? value : Math.min(min, value)
      max = max === null ? value : Math.max(max, value)
      return {
        rowId: row.id,
        columnId: col.id,
        rowIndex,
        columnIndex,
        state: 'ready' as const,
        value,
        valueText: numberText(value, unit),
        description: `${row.label} → ${col.label}：${numberText(value, unit)}`
      }
    })
  )

  const directedText = directed ? '有向' : '无向'
  const sortText =
    sort === 'input' ? '按输入序' : sort === 'degree' ? '按度数' : '按社群'
  const caption = `${directedText} · ${sortText} · ${counts.ready} 条边 · ${counts.absent} 个空档 · ${counts.unknown} 个未观测`

  return {
    version: 1,
    state: 'ready',
    directed,
    sort,
    nodes,
    cells,
    min,
    max,
    basis: BASIS[sort],
    unit,
    caption,
    excluded,
    counts
  }
}

/**
 * 色阶档位：只给 ready 单元格。
 * absent / unknown 返回 null——调用方不得涂成最浅一档，那会看起来像「权重接近 0」。
 */
export function adjacencyShade(
  cell: AdjacencyCell,
  min: number | null,
  max: number | null,
  levels = 5
): number | null {
  if (cell.state !== 'ready' || cell.value === null) return null
  if (min === null || max === null) return 1
  if (max === min) return Math.ceil(levels / 2)
  const t = (cell.value - min) / (max - min)
  return Math.min(levels, Math.max(1, Math.ceil(t * levels) || 1))
}
