import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import {
  NODE_H,
  NODE_W,
  boundsOf,
  edgeMidpoint,
  edgePath,
  type FlowEdge,
  type FlowEdgeType,
  type FlowNode
} from '@i-design/common'
import { Icon } from './Icon'

export interface FlowProps {
  nodes: FlowNode[]
  edges: FlowEdge[]
  height?: number
  /** 只读：仍可平移缩放与选中，但不能拖动节点 */
  readOnly?: boolean
  selected?: string | null
  onSelect?: (id: string | null) => void
  /** 拖动结束抛出新坐标；组件不改传入的数据 */
  onMove?: (next: { id: string; x: number; y: number }) => void
  /** 整图默认连线走向；单条连线可用 edge.type 覆盖 */
  edgeType?: FlowEdgeType
  className?: string
}

export function Flow({
  nodes,
  edges,
  height = 380,
  readOnly = false,
  selected = null,
  onSelect,
  onMove,
  edgeType = 'polyline',
  className = ''
}: FlowProps) {
  const root = useRef<HTMLDivElement>(null)
  const last = useRef({ x: 0, y: 0 })
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const [panning, setPanning] = useState(false)

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const sizeOf = (node: FlowNode) => ({ w: node.width ?? NODE_W, h: node.height ?? NODE_H })

  const fit = useCallback(() => {
    const rect = root.current?.getBoundingClientRect()
    const bounds = boundsOf(nodes)
    if (!rect || !bounds.width) return
    const scale = Math.min(2, Math.max(0.4, Math.min(rect.width / bounds.width, height / bounds.height)))
    setView({
      scale,
      x: rect.width / 2 - (bounds.x + bounds.width / 2) * scale,
      y: height / 2 - (bounds.y + bounds.height / 2) * scale
    })
    // 依赖节点数量而不是坐标：拖动位置不该把用户的视角拉回去
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, height])

  /* 挂载与增删节点时适应画布：自动布局的图往往比画布高，
     不做这一步用户只会看到第一个节点，还以为图坏了 */
  useEffect(() => {
    fit()
  }, [fit])

  const toCanvas = (event: PointerEvent) => {
    const rect = root.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (event.clientX - rect.left - view.x) / view.scale,
      y: (event.clientY - rect.top - view.y) / view.scale
    }
  }

  function onNodeDown(event: PointerEvent<SVGGElement>, node: FlowNode) {
    event.stopPropagation()
    onSelect?.(node.id)
    if (readOnly) return
    const point = toCanvas(event)
    drag.current = { id: node.id, dx: point.x - node.x, dy: point.y - node.y }
  }

  function onDown(event: PointerEvent<SVGSVGElement>) {
    onSelect?.(null)
    setPanning(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    last.current = { x: event.clientX, y: event.clientY }
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (drag.current) {
      const point = toCanvas(event)
      onMove?.({
        id: drag.current.id,
        // 吸附到 8px 网格：手绘位置总差几像素，对齐后整张图才整齐
        x: Math.round((point.x - drag.current.dx) / 8) * 8,
        y: Math.round((point.y - drag.current.dy) / 8) * 8
      })
      return
    }
    if (!panning) return
    setView((v) => ({
      ...v,
      x: v.x + (event.clientX - last.current.x),
      y: v.y + (event.clientY - last.current.y)
    }))
    last.current = { x: event.clientX, y: event.clientY }
  }

  const stop = () => {
    setPanning(false)
    drag.current = null
  }

  const zoom = (delta: number) =>
    setView((v) => ({ ...v, scale: Math.min(2, Math.max(0.4, v.scale + delta)) }))

  const isActive = (edge: FlowEdge) =>
    selected !== null && (edge.from === selected || edge.to === selected)

  const diamond = (node: FlowNode) => {
    const { w, h } = sizeOf(node)
    return `${node.x + w / 2},${node.y} ${node.x + w},${node.y + h / 2} ${node.x + w / 2},${node.y + h} ${node.x},${node.y + h / 2}`
  }

  return (
    <div
      ref={root}
      className={['i-flow', panning ? 'is-panning' : '', className].filter(Boolean).join(' ')}
      style={{ height }}
    >
      <svg
        className="i-flow__canvas"
        height={height}
        onPointerDown={onDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
      >
        <defs>
          <marker id="i-flow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="var(--i-color-border-strong)" />
          </marker>
          <marker
            id="i-flow-arrow-active"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 z" fill="var(--i-color-brand)" />
          </marker>
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {edges.map((edge) => {
            const from = byId.get(edge.from)
            const to = byId.get(edge.to)
            if (!from || !to) return null
            const mid = edgeMidpoint(from, to, edge.type ?? edgeType)
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <path
                  className={['i-flow__edge', isActive(edge) ? 'is-active' : ''].filter(Boolean).join(' ')}
                  d={edgePath(from, to, edge.type ?? edgeType)}
                  markerEnd={`url(#i-flow-arrow${isActive(edge) ? '-active' : ''})`}
                />
                {edge.label && (
                  <>
                    {/* 标签底下垫底色：不垫的话线会从字中间穿过去 */}
                    <rect
                      className="i-flow__edge-label-bg"
                      x={mid.x - edge.label.length * 6 - 2}
                      y={mid.y - 8}
                      width={edge.label.length * 12 + 4}
                      height={16}
                      rx={3}
                    />
                    <text className="i-flow__edge-label" x={mid.x} y={mid.y + 4} textAnchor="middle">
                      {edge.label}
                    </text>
                  </>
                )}
              </g>
            )
          })}

          {nodes.map((node) => {
            const type = node.type ?? 'process'
            const { w, h } = sizeOf(node)
            return (
              <g
                key={node.id}
                className={['i-flow__node', `i-flow__node--${type}`, selected === node.id ? 'is-selected' : '']
                  .filter(Boolean)
                  .join(' ')}
                onPointerDown={(e) => onNodeDown(e, node)}
              >
                {type === 'decision' ? (
                  <polygon className="i-flow__shape" points={diamond(node)} />
                ) : (
                  <rect
                    className="i-flow__shape"
                    x={node.x}
                    y={node.y}
                    width={w}
                    height={h}
                    rx={type === 'start' || type === 'end' ? h / 2 : 8}
                  />
                )}
                <text className="i-flow__label" x={node.x + w / 2} y={node.y + h / 2 + 4} textAnchor="middle">
                  {node.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      <div className="i-flow__toolbar">
        <button className="i-flow__tool" aria-label="缩小" onClick={() => zoom(-0.2)}>
          <Icon name="minus" size={14} />
        </button>
        <span className="i-flow__zoom">{Math.round(view.scale * 100)}%</span>
        <button className="i-flow__tool" aria-label="放大" onClick={() => zoom(0.2)}>
          <Icon name="plus" size={14} />
        </button>
        <button className="i-flow__tool" aria-label="适应画布" onClick={fit}>
          <Icon name="grid" size={14} />
        </button>
      </div>
    </div>
  )
}
