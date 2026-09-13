/**
 * Flow —— 流程图画布。
 *
 * 小程序没有 SVG，节点、连线、缩略图都画在同一块 canvas 上；几何计算走公共层，
 * 因此同一张图在小程序与 Web 上的连线绕法、框选判定、缩放下限都一致。
 * 触摸：单指拖节点，空白处拖动平移，开启框选后空白处拖动画选框。
 */
import {
  NODE_H,
  NODE_W,
  anchorOf,
  boundsOf,
  alignGuides,
  autoLayout,
  marqueeRect,
  minimapLayout,
  moveNodes,
  nodesInRect,
  resizeNode
} from '@i-design/common'

/** 端点沿所在边的法线外推：控制点必须在节点外侧，否则曲线会穿回节点里 */
function pushOut(point, distance) {
  if (point.side === 'left') return { x: point.x - distance, y: point.y }
  if (point.side === 'right') return { x: point.x + distance, y: point.y }
  if (point.side === 'top') return { x: point.x, y: point.y - distance }
  return { x: point.x, y: point.y + distance }
}

const MINIMAP = { width: 96, height: 64 }
const HANDLES = ['nw', 'ne', 'se', 'sw']
/** 手柄在屏幕上的半径。触摸的命中区要比画出来的大，手指没有指针那么准 */
const HANDLE_R = 5
const HANDLE_TOUCH_R = 14

Component({
  options: { addGlobalClass: true },
  properties: {
    nodes: { type: Array, value: [] },
    edges: { type: Array, value: [] },
    height: { type: Number, value: 320 },
    readonly: { type: Boolean, value: false },
    /** 选中的节点 id 数组。单选也是长度为 1 的数组——两套选中状态迟早会对不上 */
    selection: { type: Array, value: [] },
    /** 整图默认连线走向：polyline / straight / bezier；单条连线可用 edge.type 覆盖 */
    edgeType: { type: String, value: 'polyline' }
  },
  data: { scaleText: '100%', marqueeMode: false, showMinimap: true },
  observers: {
    'nodes, edges, selection, edgeType': function () { this.draw() }
  },
  lifetimes: {
    attached() {
      this.view = { x: 0, y: 0, scale: 1 }
      this.drag = null
      this.resizing = null
      this.marquee = null
      this.guides = []
      this.setup()
    }
  },
  methods: {
    setup() {
      this.createSelectorQuery()
        .select('.i-flow__canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const item = res && res[0]
          if (!item || !item.node) return
          this.canvas = item.node
          this.box = { width: item.width, height: item.height }
          const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
          this.canvas.width = item.width * dpr
          this.canvas.height = item.height * dpr
          this.dpr = dpr
          this.fit()
        })
    },

    fit() {
      if (!this.box) return
      const b = boundsOf(this.data.nodes)
      if (!b.width || !b.height) return
      const scale = Math.min(2, Math.max(0.4, Math.min(this.box.width / b.width, this.box.height / b.height)))
      this.view = {
        scale,
        x: this.box.width / 2 - (b.x + b.width / 2) * scale,
        y: this.box.height / 2 - (b.y + b.height / 2) * scale
      }
      this.setData({ scaleText: `${Math.round(scale * 100)}%` })
      this.draw()
    },

    zoom(e) {
      const delta = Number(e.currentTarget.dataset.delta)
      this.view = { ...this.view, scale: Math.min(2, Math.max(0.4, this.view.scale + delta)) }
      this.setData({ scaleText: `${Math.round(this.view.scale * 100)}%` })
      this.draw()
    },

    /*
     * 触摸端没有 Shift 键，框选只能做成一个显式开关。
     * 长按进入框选也是一种选择，但那样「想平移却按久了」就会莫名画出选框。
     */
    toggleMarquee() {
      this.setData({ marqueeMode: !this.data.marqueeMode })
    },

    toggleMinimap() {
      this.setData({ showMinimap: !this.data.showMinimap }, () => this.draw())
    },

    /** 屏幕坐标 → 画布坐标 */
    toCanvas(touch) {
      return {
        x: (touch.x - this.view.x) / this.view.scale,
        y: (touch.y - this.view.y) / this.view.scale
      }
    },

    hitTest(point) {
      // 从后往前找：后画的节点在上面
      const nodes = this.data.nodes
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const w = n.width || NODE_W
        const h = n.height || NODE_H
        if (point.x >= n.x && point.x <= n.x + w && point.y >= n.y && point.y <= n.y + h) return n
      }
      return null
    },

    /** 恰好选中一个节点时，四角才有手柄——多选时拖角改的是哪一个并不清楚 */
    resizeTarget() {
      const ids = this.data.selection || []
      if (this.data.readonly || ids.length !== 1) return null
      return this.data.nodes.find((n) => n.id === ids[0]) || null
    },

    handlePoints(node) {
      const w = node.width || NODE_W
      const h = node.height || NODE_H
      return [
        { handle: 'nw', x: node.x, y: node.y },
        { handle: 'ne', x: node.x + w, y: node.y },
        { handle: 'se', x: node.x + w, y: node.y + h },
        { handle: 'sw', x: node.x, y: node.y + h }
      ]
    },

    hitHandle(point) {
      const node = this.resizeTarget()
      if (!node) return null
      // 命中半径按屏幕像素折算回画布：缩小后手柄看起来更小，手指却没变细
      const r = HANDLE_TOUCH_R / this.view.scale
      for (const h of this.handlePoints(node)) {
        if (Math.abs(point.x - h.x) <= r && Math.abs(point.y - h.y) <= r) {
          return { id: node.id, handle: h.handle }
        }
      }
      return null
    },

    onTouchStart(e) {
      const touch = e.touches[0]
      this.last = { x: touch.x, y: touch.y }
      const point = this.toCanvas(touch)

      // 手柄压在节点角上，必须先于节点判定，否则永远抓不到
      const handle = this.hitHandle(point)
      if (handle) {
        this.resizing = handle
        return
      }

      if (this.data.marqueeMode && !this.hitTest(point)) {
        this.marquee = { from: point, to: point }
        return
      }

      const node = this.hitTest(point)
      if (!node) {
        this.triggerEvent('selectionchange', { ids: [] })
        return
      }
      // 点已在选中集合里的节点不清空选择，否则批量拖动第一下就把组拆了
      const current = this.data.selection || []
      const ids = current.indexOf(node.id) >= 0 ? current : [node.id]
      this.triggerEvent('selectionchange', { ids })
      this.drag = this.data.readonly ? null : { ids, from: point, base: this.geometryOf(ids) }
    },

    geometryOf(ids) {
      return this.data.nodes
        .filter((n) => ids.indexOf(n.id) >= 0)
        .map((n) => ({ id: n.id, x: n.x, y: n.y, width: n.width, height: n.height, label: n.label }))
    },

    onTouchMove(e) {
      const touch = e.touches[0]
      const point = this.toCanvas(touch)

      if (this.marquee) {
        this.marquee = { from: this.marquee.from, to: point }
        this.draw()
        return
      }

      if (this.resizing) {
        const node = this.data.nodes.find((n) => n.id === this.resizing.id)
        if (!node) return
        const box = resizeNode(node, this.resizing.handle, point)
        this.triggerEvent('move', { changes: [{ id: node.id, ...box }] })
        return
      }

      if (this.drag) {
        /*
         * 位移量整体吸附一次：逐个吸附会把组内原本的相对间距抹平。
         *
         * 对齐优先于网格：两者都是吸附，但网格吸的是「整齐」，对齐吸的是
         * 「和那一个对上」——后者才是用户此刻在做的事。先按网格吸的话，
         * 节点只能落在 8 的倍数上，中间那几像素到不了，辅助线也就永远不出现。
         */
        const delta = { x: point.x - this.drag.from.x, y: point.y - this.drag.from.y }
        const free = moveNodes(this.drag.base, this.drag.ids, delta, 0)
        const grid = moveNodes(this.drag.base, this.drag.ids, delta)
        const sizeOf = (id) => {
          const found = this.drag.base.find((g) => g.id === id)
          return { width: found && found.width, height: found && found.height }
        }
        const picked = new Set(this.drag.ids)
        const anchor = free[0]
        const aligned = anchor
          ? alignGuides(
              { ...anchor, label: '', ...sizeOf(anchor.id) },
              (this.data.nodes || []).filter((n) => !picked.has(n.id)),
              6 / this.view.scale
            )
          : { dx: 0, dy: 0, guides: [] }
        this.guides = aligned.guides
        const onX = aligned.guides.some((g) => g.orientation === 'v')
        const onY = aligned.guides.some((g) => g.orientation === 'h')
        this.triggerEvent('move', {
          changes: free.map((m, i) => ({
            id: m.id,
            x: onX ? m.x + aligned.dx : grid[i].x,
            y: onY ? m.y + aligned.dy : grid[i].y,
            ...sizeOf(m.id)
          }))
        })
        this.draw()
        return
      }

      this.view = {
        ...this.view,
        x: this.view.x + (touch.x - this.last.x),
        y: this.view.y + (touch.y - this.last.y)
      }
      this.last = { x: touch.x, y: touch.y }
      this.draw()
    },

    onTouchEnd() {
      if (this.marquee) {
        const rect = marqueeRect(this.marquee.from, this.marquee.to)
        // 只有拖出了实际面积才当作框选：原地一点应当理解为「取消选中」
        const ids = rect.width > 4 && rect.height > 4 ? nodesInRect(this.data.nodes, rect) : []
        this.triggerEvent('selectionchange', { ids })
        this.marquee = null
        this.draw()
      }
      this.drag = null
      this.resizing = null
      // 辅助线是拖动时的提示，松手就清空
      if (this.guides && this.guides.length) {
        this.guides = []
        this.draw()
      }
    },

    /**
     * 一键排版。走的是与手动拖动同一条 move 事件，调用方那边的撤销才接得上——
     * 一键把别人排了半天的图重排一遍却撤不回去，那是把一个便利做成了事故。
     */
    layout() {
      if (this.data.readonly) return
      const laid = autoLayout(this.data.nodes || [], this.data.edges || [])
      this.triggerEvent('move', {
        changes: laid.map((n) => {
          const before = (this.data.nodes || []).find((m) => m.id === n.id)
          return { id: n.id, x: n.x, y: n.y, width: before && before.width, height: before && before.height }
        })
      })
    },

    /** 点缩略图跳过去：大图里这是唯一比反复拖画布快的导航方式 */
    onMinimapTap(e) {
      if (!this.data.showMinimap || !this.box) return
      const layout = this.minimap()
      if (!layout) return
      const local = { x: e.detail.x - layout.originX, y: e.detail.y - layout.originY }
      if (local.x < 0 || local.y < 0 || local.x > MINIMAP.width || local.y > MINIMAP.height) return
      const canvasX = (local.x - layout.offsetX) / layout.scale
      const canvasY = (local.y - layout.offsetY) / layout.scale
      this.view = {
        scale: this.view.scale,
        x: this.box.width / 2 - canvasX * this.view.scale,
        y: this.box.height / 2 - canvasY * this.view.scale
      }
      this.draw()
    },

    minimap() {
      if (!this.box || !this.data.nodes.length) return null
      const layout = minimapLayout(this.data.nodes, this.view, this.box, MINIMAP)
      // 缩略图贴左上角，与右下的工具条分开
      return { ...layout, originX: 8, originY: 8 }
    },

    /**
     * 导出快照。
     *
     * 导出前先重绘一遍去掉缩略图、选框与手柄——它们是编辑器的一部分，
     * 不是图的一部分，留在图里等于把工具条一起交给用户。
     */
    exportImage() {
      if (!this.canvas) return
      this.draw({ chrome: false })
      wx.canvasToTempFilePath({
        canvas: this.canvas,
        success: (res) => {
          this.triggerEvent('export', { tempFilePath: res.tempFilePath })
          this.draw()
        },
        fail: () => this.draw()
      }, this)
    },

    draw(options) {
      if (!this.canvas || !this.box) return
      const chrome = !options || options.chrome !== false
      const ctx = this.canvas.getContext('2d')
      const { nodes, edges, selection, edgeType } = this.data
      const { width, height } = this.box
      const picked = {}
      ;(selection || []).forEach((id) => (picked[id] = true))

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.translate(this.view.x, this.view.y)
      ctx.scale(this.view.scale, this.view.scale)

      const byId = {}
      nodes.forEach((n) => (byId[n.id] = n))

      edges.forEach((edge) => {
        const from = byId[edge.from]
        const to = byId[edge.to]
        if (!from || !to) return
        const active = picked[edge.from] || picked[edge.to]
        const a = anchorOf(
          from,
          { x: to.x + (to.width || NODE_W) / 2, y: to.y + (to.height || NODE_H) / 2 },
          edge.fromSide
        )
        const b = anchorOf(
          to,
          { x: from.x + (from.width || NODE_W) / 2, y: from.y + (from.height || NODE_H) / 2 },
          edge.toSide
        )

        const kind = edge.type || edgeType
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        if (kind === 'straight') {
          ctx.lineTo(b.x, b.y)
        } else if (kind === 'bezier') {
          // 控制点沿端点所在边的法线外推，箭头进出方向才与锚点边一致
          const push = Math.min(120, Math.max(32, Math.hypot(b.x - a.x, b.y - a.y) / 2))
          const c1 = pushOut(a, push)
          const c2 = pushOut(b, push)
          ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, b.x, b.y)
        } else if (a.side === 'bottom' || a.side === 'top') {
          // 直角折线：斜线穿过其他节点时难辨走向
          const midY = (a.y + b.y) / 2
          ctx.lineTo(a.x, midY)
          ctx.lineTo(b.x, midY)
          ctx.lineTo(b.x, b.y)
        } else {
          const midX = a.side === 'right'
            ? Math.max(a.x + 18, (a.x + b.x) / 2)
            : Math.min(a.x - 18, (a.x + b.x) / 2)
          ctx.lineTo(midX, a.y)
          ctx.lineTo(midX, b.y)
          ctx.lineTo(b.x, b.y)
        }
        ctx.strokeStyle = active ? '#5e7ce0' : '#c3c6cd'
        ctx.lineWidth = active ? 2 : 1.5
        ctx.stroke()
      })

      nodes.forEach((node) => {
        const w = node.width || NODE_W
        const h = node.height || NODE_H
        const type = node.type || 'process'
        const fill = { start: '#eef3ff', end: '#e8f8f0', decision: '#fff4e6' }[type] || '#ffffff'
        const stroke = { start: '#5e7ce0', end: '#3ac295', decision: '#fa9841' }[type] || '#c3c6cd'

        ctx.beginPath()
        if (type === 'decision') {
          ctx.moveTo(node.x + w / 2, node.y)
          ctx.lineTo(node.x + w, node.y + h / 2)
          ctx.lineTo(node.x + w / 2, node.y + h)
          ctx.lineTo(node.x, node.y + h / 2)
          ctx.closePath()
        } else {
          const r = type === 'start' || type === 'end' ? h / 2 : 8
          ctx.moveTo(node.x + r, node.y)
          ctx.arcTo(node.x + w, node.y, node.x + w, node.y + h, r)
          ctx.arcTo(node.x + w, node.y + h, node.x, node.y + h, r)
          ctx.arcTo(node.x, node.y + h, node.x, node.y, r)
          ctx.arcTo(node.x, node.y, node.x + w, node.y, r)
          ctx.closePath()
        }
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = picked[node.id] ? '#5e7ce0' : stroke
        ctx.lineWidth = picked[node.id] ? 2 : 1.5
        ctx.stroke()

        ctx.fillStyle = '#252b3a'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.label, node.x + w / 2, node.y + h / 2 + 5)
      })

      if (chrome) {
        // 手柄画在所有节点之上：压在下面会被相邻节点盖住，抓不到
        const target = this.resizeTarget()
        if (target) {
          const r = HANDLE_R / this.view.scale
          ctx.lineWidth = 1.5 / this.view.scale
          this.handlePoints(target).forEach((h) => {
            ctx.beginPath()
            ctx.rect(h.x - r, h.y - r, r * 2, r * 2)
            ctx.fillStyle = '#ffffff'
            ctx.fill()
            ctx.strokeStyle = '#5e7ce0'
            ctx.stroke()
          })
        }

        if (this.marquee) {
          const rect = marqueeRect(this.marquee.from, this.marquee.to)
          // 虚线描边加极淡的填充：只描边的话看不出框盖住了哪些节点
          ctx.fillStyle = 'rgba(94, 124, 224, 0.08)'
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
          ctx.setLineDash([4 / this.view.scale, 3 / this.view.scale])
          ctx.strokeStyle = '#5e7ce0'
          ctx.lineWidth = 1 / this.view.scale
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
          ctx.setLineDash([])
        }

        /*
         * 对齐辅助线。虚线而不是实线：实线会和真正的连线混在一起，
         * 读者要多看一眼才知道那不是图的一部分。
         */
        if (this.guides && this.guides.length) {
          ctx.setLineDash([4 / this.view.scale, 3 / this.view.scale])
          ctx.strokeStyle = '#5e7ce0'
          ctx.lineWidth = 1 / this.view.scale
          for (const guide of this.guides) {
            ctx.beginPath()
            if (guide.orientation === 'v') {
              ctx.moveTo(guide.at, guide.from)
              ctx.lineTo(guide.at, guide.to)
            } else {
              ctx.moveTo(guide.from, guide.at)
              ctx.lineTo(guide.to, guide.at)
            }
            ctx.stroke()
          }
          ctx.setLineDash([])
        }
      }

      ctx.restore()

      if (chrome && this.data.showMinimap) this.drawMinimap(ctx, picked)
    },

    /** 缩略图画在同一块 canvas 上：小程序里再开一块 canvas 只为了画六个方块并不划算 */
    drawMinimap(ctx, picked) {
      const layout = this.minimap()
      if (!layout) return
      ctx.save()
      ctx.translate(layout.originX, layout.originY)
      ctx.beginPath()
      ctx.rect(0, 0, MINIMAP.width, MINIMAP.height)
      // 裁掉溢出：视口比整图大时取景框会伸到缩略图外面，看起来像画歪了
      ctx.clip()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
      ctx.fillRect(0, 0, MINIMAP.width, MINIMAP.height)

      this.data.nodes.forEach((node) => {
        ctx.fillStyle = picked[node.id] ? '#5e7ce0' : '#c3c6cd'
        ctx.fillRect(
          node.x * layout.scale + layout.offsetX,
          node.y * layout.scale + layout.offsetY,
          (node.width || NODE_W) * layout.scale,
          (node.height || NODE_H) * layout.scale
        )
      })

      // 取景框只描边不填充：填了就看不见它盖住的是哪几个节点
      ctx.strokeStyle = '#5e7ce0'
      ctx.lineWidth = 1.5
      ctx.strokeRect(layout.viewport.x, layout.viewport.y, layout.viewport.width, layout.viewport.height)
      ctx.restore()

      ctx.strokeStyle = '#e5e6eb'
      ctx.lineWidth = 1
      ctx.strokeRect(layout.originX, layout.originY, MINIMAP.width, MINIMAP.height)
    }
  }
})
