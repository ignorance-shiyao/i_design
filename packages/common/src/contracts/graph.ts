/**
 * 流程图文档。
 *
 * 这是一份**会被存起来、以后再打开**的数据，所以它的要求与界面状态不同：
 * 往返必须无损。用户在新版里加的东西，被旧版打开、保存一次之后不能消失——
 * 那是一种最难追查的数据丢失：没有报错，只是「我上周画的泳道不见了」。
 *
 * 因此约定：解析时不认识的字段一律原样留着（extras），
 * 不认识的节点类型也不丢弃，而是标成只读占位并说明原因。
 */

export interface GraphPort {
  id: string
  /** in / out；连线方向校验按它判断 */
  side: 'in' | 'out'
  label?: string
}

export interface GraphNode {
  id: string
  /** 节点类型，决定用哪个渲染器与属性表 */
  type: string
  x: number
  y: number
  width?: number
  height?: number
  label: string
  ports?: GraphPort[]
  /** 业务属性，由节点类型自己解释 */
  data?: Record<string, unknown>
  groupId?: string
  /** 解析时不认识的字段原样留着，保存时写回去 */
  extras?: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  fromPort?: string
  toPort?: string
  label?: string
  type?: string
  extras?: Record<string, unknown>
}

export interface GraphGroup {
  id: string
  label: string
  /** 泳道或子流程的成员节点 */
  nodeIds: string[]
  extras?: Record<string, unknown>
}

export interface GraphViewport {
  x: number
  y: number
  zoom: number
}

export interface GraphMeta {
  title?: string
  updatedAt?: number
  /** 谁改的，用于冲突提示 */
  updatedBy?: string
  extras?: Record<string, unknown>
}

/** 当前文档版本。每次结构变化都要 +1，并补一条迁移 */
export const GRAPH_VERSION = 2

export interface GraphDocument {
  version: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  groups: GraphGroup[]
  viewport: GraphViewport
  meta: GraphMeta
  /** 文档级的未知字段 */
  extras?: Record<string, unknown>
}
