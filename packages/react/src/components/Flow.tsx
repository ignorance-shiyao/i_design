import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent
} from 'react'
import {
  NODE_H,
  NODE_W,
  boundsOf,
  edgeMidpoint,
  edgePath,
  flatten,
  alignGuides,
  marqueeRect,
  minimapLayout,
  moveNodes,
  nodesInRect,
  resizeNode,
  snapshotStyle,
  snapshotViewBox,
  viewFromMinimap,
  type FlowEdge,
  type FlowEdgeType,
  type FlowGuide,
  type FlowNode,
  type FlowResizeHandle
} from '@i-design/common'
import { Icon } from './Icon'

/**
 * 一次操作涉及的全部节点几何。
 * 记「一组」而不是「一个」：框选后批量拖动的十个节点是一次操作，
 * 撤销就该一次退回去，按十次才回到原处的撤销和没有撤销差不多。
 */
type Geometry = { id: string; x: number; y: number; width?: number; height?: number }
interface EditRecord {
  before: Geometry[]
  after: Geometry[]
}

const MINIMAP = { width: 168, height: 112 }

export interface FlowProps {
  nodes: FlowNode[]
  edges: FlowEdge[]
  height?: number
  /** 只读：仍可平移缩放与选中，但不能拖动、缩放节点 */
  readOnly?: boolean
  /** 选中的节点。单选也是长度为 1 的数组——两套选中状态迟早会对不上 */
  selection?: string[]
  onSelectionChange?: (ids: string[]) => void
  /** 拖动或缩放结束抛出一组新几何；组件不改传入的数据 */
  onMove?: (next: Geometry[]) => void
  /** 整图默认连线走向；单条连线可用 edge.type 覆盖 */
  edgeType?: FlowEdgeType
  /** 导出文件名，不含扩展名 */
  exportName?: string
  className?: string
}

export function Flow({
  nodes,
  edges,
  height = 380,
  readOnly = false,
  selection = [],
  onSelectionChange,
  onMove,
  edgeType = 'polyline',
  exportName = 'flow',
  className = ''
}: FlowProps) {
  const root = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const last = useRef({ x: 0, y: 0 })
  const drag = useRef<{ ids: string[]; from: { x: number; y: number } } | null>(null)
  const resize = useRef<{ id: string; handle: FlowResizeHandle } | null>(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const [panning, setPanning] = useState(false)
  const [marquee, setMarquee] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null)
  const [marqueeMode, setMarqueeMode] = useState(false)
  /* 拖动时的对齐辅助线。松手就清空——它是拖动过程中的提示，不是图的一部分 */
  const [guides, setGuides] = useState<FlowGuide[]>([])
  const [showMinimap, setShowMinimap] = useState(true)

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const selectedSet = new Set(selection)
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

  /*
   * 撤销 / 重做。
   *
   * 节点数据归调用方所有，组件不改它——所以记的不是快照，而是每次操作的起止几何；
   * 撤销就是反着回调一次 onMove。只记完整的一次操作（按下到抬起），
   * 不记过程中的每一帧，否则撤销一次只退回一个像素。
   */
  const [undoStack, setUndoStack] = useState<EditRecord[]>([])
  const [redoStack, setRedoStack] = useState<EditRecord[]>([])
  const editBefore = useRef<Geometry[] | null>(null)
  const editAfter = useRef<Geometry[] | null>(null)

  const geometryOf = (ids: string[]): Geometry[] =>
    ids
      .map((id) => byId.get(id))
      .filter((n): n is FlowNode => !!n)
      .map((n) => ({ id: n.id, x: n.x, y: n.y, width: n.width, height: n.height }))

  function undo() {
    const record = undoStack[undoStack.length - 1]
    if (!record) return
    setUndoStack(undoStack.slice(0, -1))
    setRedoStack([...redoStack, record])
    onMove?.(record.before)
  }

  function redo() {
    const record = redoStack[redoStack.length - 1]
    if (!record) return
    setRedoStack(redoStack.slice(0, -1))
    setUndoStack([...undoStack, record])
    onMove?.(record.after)
  }

  function commitEdit() {
    const before = editBefore.current
    const after = editAfter.current
    if (before && after) {
      const changed = after.some((a, i) => {
        const b = before[i]
        return !b || a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height
      })
      // 没真的动过就不入栈，否则「撤销」会在原地空点几次
      if (changed) {
        setUndoStack((stack) => [...stack, { before, after }])
        // 新动作让重做栈作废：分支历史会让「重做」跳到用户没走过的路径上
        setRedoStack([])
      }
    }
    editBefore.current = null
    editAfter.current = null
  }

  /*
   * 快捷键绑在画布上而不是 window：同一页可能有多张画布，也可能有输入框，
   * 绑到全局会把别处的撤销一起劫走。画布需要 tabIndex 才能接到键盘事件。
   */
  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onSelectionChange?.([])
      return
    }
    if (!(event.metaKey || event.ctrlKey)) return
    const key = event.key.toLowerCase()
    if (key === 'a') {
      event.preventDefault()
      onSelectionChange?.(nodes.map((n) => n.id))
    } else if (key === 'z' && !event.shiftKey) {
      event.preventDefault()
      undo()
    } else if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault()
      redo()
    }
  }

  function onNodeDown(event: PointerEvent<SVGGElement>, node: FlowNode) {
    event.stopPropagation()
    // 加选：Shift / Cmd 点击往选中集合里增删，不加修饰键则重置为这一个
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    let ids: string[]
    if (additive) {
      ids = selectedSet.has(node.id) ? selection.filter((id) => id !== node.id) : [...selection, node.id]
    } else {
      // 点已在选中集合里的节点不清空选择，否则批量拖动第一下就把组拆了
      ids = selectedSet.has(node.id) ? selection : [node.id]
    }
    onSelectionChange?.(ids)
    if (readOnly || !ids.includes(node.id)) return

    drag.current = { ids, from: toCanvas(event) }
    editBefore.current = geometryOf(ids)
    editAfter.current = null
  }

  function onHandleDown(event: PointerEvent<SVGRectElement>, node: FlowNode, handle: FlowResizeHandle) {
    event.stopPropagation()
    if (readOnly) return
    resize.current = { id: node.id, handle }
    editBefore.current = geometryOf([node.id])
    editAfter.current = null
  }

  function onDown(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    // 框选模式或按住 Shift：拖出选框；否则点空白处取消选中并平移
    if (marqueeMode || event.shiftKey) {
      const point = toCanvas(event)
      setMarquee({ from: point, to: point })
      return
    }
    onSelectionChange?.([])
    setPanning(true)
    last.current = { x: event.clientX, y: event.clientY }
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (marquee) {
      const point = toCanvas(event)
      setMarquee((m) => (m ? { ...m, to: point } : m))
      return
    }
    if (resize.current) {
      const node = byId.get(resize.current.id)
      if (!node) return
      const box = resizeNode(node, resize.current.handle, toCanvas(event))
      editAfter.current = [{ id: node.id, ...box }]
      onMove?.(editAfter.current)
      return
    }
    if (drag.current) {
      const point = toCanvas(event)
      const delta = { x: point.x - drag.current.from.x, y: point.y - drag.current.from.y }
      const base = editBefore.current ?? []
      const asNodes = base.map((g) => ({ ...g, label: '' })) as FlowNode[]
      // 位移量整体吸附一次：逐个吸附会把组内原本的相对间距抹平
      const free = moveNodes(asNodes, drag.current.ids, delta, 0)
      const grid = moveNodes(asNodes, drag.current.ids, delta)

      /* 只取尺寸。连 x/y 一起取回来的话，对齐算的就是拖动前的位置，永远是「已经对齐」 */
      const sizeOf = (id: string) => {
        const found = base.find((g) => g.id === id)
        return { width: found?.width, height: found?.height }
      }

      /*
       * 对齐优先于网格。
       *
       * 两者都是吸附，但网格吸的是「整齐」，对齐吸的是「和那一个对上」——
       * 后者才是用户此刻在做的事。先按网格吸的话，节点只能落在 8 的倍数上，
       * 于是要么正好对齐、要么差 8 像素，中间那几像素根本到不了，辅助线也就永远不出现。
       *
       * 阈值按缩放换算：缩到 50% 时屏幕上的 6px 是画布上的 12px。
       */
      const anchorId = drag.current.ids[0]
      const anchor = free.find((m) => m.id === anchorId)
      const picked = new Set(drag.current.ids)
      const aligned = anchor
        ? alignGuides(
            { ...anchor, label: '', ...sizeOf(anchorId) } as FlowNode,
            nodes.filter((n) => !picked.has(n.id)),
            6 / view.scale
          )
        : { dx: 0, dy: 0, guides: [] as FlowGuide[] }
      setGuides(aligned.guides)

      const onX = aligned.guides.some((g) => g.orientation === 'v')
      const onY = aligned.guides.some((g) => g.orientation === 'h')
      editAfter.current = free.map((m) => {
        const snapped = grid.find((g) => g.id === m.id)!
        return {
          id: m.id,
          x: onX ? m.x + aligned.dx : snapped.x,
          y: onY ? m.y + aligned.dy : snapped.y,
          ...sizeOf(m.id)
        }
      })
      onMove?.(editAfter.current)
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
    if (marquee) {
      const rect = marqueeRect(marquee.from, marquee.to)
      // 只有拖出了实际面积才当作框选：原地一点应当理解为「取消选中」
      onSelectionChange?.(rect.width > 4 && rect.height > 4 ? nodesInRect(nodes, rect) : [])
      setMarquee(null)
      return
    }
    setPanning(false)
    commitEdit()
    drag.current = null
    resize.current = null
    setGuides([])
  }

  const zoom = (delta: number) =>
    setView((v) => ({ ...v, scale: Math.min(2, Math.max(0.4, v.scale + delta)) }))

  /* ---------- 缩略图 ---------- */

  const canvasSize = { width: root.current?.getBoundingClientRect().width ?? 640, height }
  const minimap = minimapLayout(nodes, view, canvasSize, MINIMAP)

  function onMinimapDown(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    setView(
      viewFromMinimap(
        { x: event.clientX - rect.left, y: event.clientY - rect.top },
        minimap,
        view,
        canvasSize
      )
    )
  }

  /* ---------- 快照导出 ---------- */

  /**
   * 导出当前图为 SVG 文件。
   *
   * 导出的是整张图而不是当前视口：按视口导出，用户拿到的文件会缺掉他没滚动到的
   * 部分，而他并不会察觉。工具条、选框、手柄这些界面件也要摘掉——
   * 它们是编辑器的一部分，不是图的一部分。
   */
  function exportSvg() {
    const source = svgRef.current
    if (!source) return
    const box = snapshotViewBox(nodes)
    const clone = source.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`)
    clone.setAttribute('width', String(Math.round(box.width)))
    clone.setAttribute('height', String(Math.round(box.height)))
    // 画布的平移缩放属于「我现在怎么看」，导出时要还原成图自身的坐标
    clone.querySelector('.i-flow__scene')?.removeAttribute('transform')
    clone.querySelector('.i-flow__marquee')?.remove()
    clone.querySelectorAll('.i-flow__handle').forEach((el) => el.remove())
    // 辅助线是拖动时的提示，不该出现在导出的图里
    clone.querySelectorAll('.i-flow__guide').forEach((el) => el.remove())

    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = `${snapshotStyle(flatten())}\n${flowCss()}`
    clone.insertBefore(style, clone.firstChild)

    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml;charset=utf-8'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportName}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 把页面里 .i-flow 相关的规则抄进导出文件。
   *
   * 不这样做就得在这里再写一份样式，两份迟早分叉：页面上改了描边粗细，
   * 导出的文件还是旧的，而且没有任何检查会发现。
   */
  function flowCss() {
    const out: string[] = []
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList
      try {
        rules = sheet.cssRules
      } catch {
        // 跨域样式表读不到 cssRules，跳过即可——图的样式都在本地表里
        continue
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes('.i-flow__')) {
          out.push(rule.cssText)
        }
      }
    }
    return out.join('\n')
  }

  const isActive = (edge: FlowEdge) => selectedSet.has(edge.from) || selectedSet.has(edge.to)

  const diamond = (node: FlowNode) => {
    const { w, h } = sizeOf(node)
    return `${node.x + w / 2},${node.y} ${node.x + w},${node.y + h / 2} ${node.x + w / 2},${node.y + h} ${node.x},${node.y + h / 2}`
  }

  /** 缩放手柄只在「恰好选中一个节点」时出现：多选时拖角改的是哪一个并不清楚 */
  const resizeTarget = !readOnly && selection.length === 1 ? byId.get(selection[0]) ?? null : null
  const handlesOf = (node: FlowNode) => {
    const { w, h } = sizeOf(node)
    return [
      { handle: 'nw' as const, x: node.x, y: node.y, cursor: 'nwse-resize' },
      { handle: 'ne' as const, x: node.x + w, y: node.y, cursor: 'nesw-resize' },
      { handle: 'se' as const, x: node.x + w, y: node.y + h, cursor: 'nwse-resize' },
      { handle: 'sw' as const, x: node.x, y: node.y + h, cursor: 'nesw-resize' }
    ]
  }

  const marqueeBox = marquee ? marqueeRect(marquee.from, marquee.to) : null

  return (
    <div
      ref={root}
      className={['i-flow', panning ? 'is-panning' : '', marqueeMode ? 'is-marquee' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ height }}
      // tabIndex 让画布能接到键盘：快捷键绑在画布上，不劫持页面别处的撤销
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <svg
        ref={svgRef}
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

        <g className="i-flow__scene" transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
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
                className={['i-flow__node', `i-flow__node--${type}`, selectedSet.has(node.id) ? 'is-selected' : '']
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

          {/* 缩放手柄画在所有节点之上：压在下面会被相邻节点盖住，抓不到 */}
          {resizeTarget &&
            handlesOf(resizeTarget).map((h) => (
              <rect
                key={h.handle}
                className="i-flow__handle"
                x={h.x - 4}
                y={h.y - 4}
                width={8}
                height={8}
                rx={2}
                style={{ cursor: h.cursor }}
                onPointerDown={(e) => onHandleDown(e, resizeTarget, h.handle)}
              />
            ))}

          {marqueeBox && (
            <rect
              className="i-flow__marquee"
              x={marqueeBox.x}
              y={marqueeBox.y}
              width={marqueeBox.width}
              height={marqueeBox.height}
            />
          )}

          {/*
            对齐辅助线。只在拖动过程中出现，松手即消失——它是操作时的提示，
            不是图的一部分，留在画布上会被当成一条真的连线。
          */}
          {guides.map((guide, index) => (
            <line
              key={index}
              className="i-flow__guide"
              x1={guide.orientation === 'v' ? guide.at : guide.from}
              y1={guide.orientation === 'v' ? guide.from : guide.at}
              x2={guide.orientation === 'v' ? guide.at : guide.to}
              y2={guide.orientation === 'v' ? guide.to : guide.at}
            />
          ))}
        </g>
      </svg>

      {/*
        缩略图：整张图的缩小版加一个取景框。点哪里就跳到哪里——
        大图里这是唯一比拖滚动条快的导航方式。
      */}
      {showMinimap && (
        <div className="i-flow__minimap" onPointerDown={onMinimapDown}>
          <svg width={MINIMAP.width} height={MINIMAP.height} aria-hidden="true">
            {nodes.map((node) => (
              <rect
                key={node.id}
                className={['i-flow__minimap-node', selectedSet.has(node.id) ? 'is-selected' : '']
                  .filter(Boolean)
                  .join(' ')}
                x={node.x * minimap.scale + minimap.offsetX}
                y={node.y * minimap.scale + minimap.offsetY}
                width={(node.width ?? NODE_W) * minimap.scale}
                height={(node.height ?? NODE_H) * minimap.scale}
                rx={1}
              />
            ))}
            <rect
              className="i-flow__minimap-viewport"
              x={minimap.viewport.x}
              y={minimap.viewport.y}
              width={minimap.viewport.width}
              height={minimap.viewport.height}
            />
          </svg>
        </div>
      )}

      {!readOnly && (
        <div className="i-flow__toolbar i-flow__toolbar--history">
          <button className="i-flow__tool" aria-label="撤销" disabled={undoStack.length === 0} onClick={undo}>
            <Icon name="undo" size={14} />
          </button>
          <button className="i-flow__tool" aria-label="重做" disabled={redoStack.length === 0} onClick={redo}>
            <Icon name="redo" size={14} />
          </button>
        </div>
      )}

      <div className="i-flow__toolbar">
        {!readOnly && (
          <button
            className={['i-flow__tool', marqueeMode ? 'is-on' : ''].filter(Boolean).join(' ')}
            aria-pressed={marqueeMode}
            aria-label="框选（或按住 Shift 拖动）"
            onClick={() => setMarqueeMode(!marqueeMode)}
          >
            <Icon name="marquee" size={14} />
          </button>
        )}
        <button
          className={['i-flow__tool', showMinimap ? 'is-on' : ''].filter(Boolean).join(' ')}
          aria-pressed={showMinimap}
          aria-label="缩略图"
          onClick={() => setShowMinimap(!showMinimap)}
        >
          <Icon name="minimap" size={14} />
        </button>
        <button className="i-flow__tool" aria-label="导出 SVG" onClick={exportSvg}>
          <Icon name="download" size={14} />
        </button>
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
