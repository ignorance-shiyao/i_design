/**
 * Flow —— 流程图画布。
 *
 * 小程序没有 SVG，节点与连线都画在 canvas 上；几何计算走公共层，
 * 因此同一张图在小程序与 Web 上的连线绕法一致。
 * 触摸：单指拖节点，空白处拖动平移。
 */
import { NODE_H, NODE_W, anchorOf, boundsOf } from '@i-design/common'

/** 端点沿所在边的法线外推：控制点必须在节点外侧，否则曲线会穿回节点里 */
function pushOut(point, distance) {
  if (point.side === 'left') return { x: point.x - distance, y: point.y }
  if (point.side === 'right') return { x: point.x + distance, y: point.y }
  if (point.side === 'top') return { x: point.x, y: point.y - distance }
  return { x: point.x, y: point.y + distance }
}

Component({
  options: { addGlobalClass: true },
  properties: {
    nodes: { type: Array, value: [] },
    edges: { type: Array, value: [] },
    height: { type: Number, value: 320 },
    readonly: { type: Boolean, value: false },
    selected: { type: String, value: '' },
    /** 整图默认连线走向：polyline / straight / bezier；单条连线可用 edge.type 覆盖 */
    edgeType: { type: String, value: 'polyline' }
  },
  data: { scaleText: '100%' },
  observers: {
    'nodes, edges, selected, edgeType': function () { this.draw() }
  },
  lifetimes: {
    attached() {
      this.view = { x: 0, y: 0, scale: 1 }
      this.drag = null
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

    onTouchStart(e) {
      const touch = e.touches[0]
      this.last = { x: touch.x, y: touch.y }
      const node = this.hitTest(this.toCanvas(touch))
      this.triggerEvent('select', { id: node ? node.id : '' })
      this.drag = node && !this.data.readonly
        ? { id: node.id, dx: this.toCanvas(touch).x - node.x, dy: this.toCanvas(touch).y - node.y }
        : null
    },

    onTouchMove(e) {
      const touch = e.touches[0]
      if (this.drag) {
        const point = this.toCanvas(touch)
        this.triggerEvent('move', {
          id: this.drag.id,
          // 吸附到 8 的倍数：手绘位置总差几像素
          x: Math.round((point.x - this.drag.dx) / 8) * 8,
          y: Math.round((point.y - this.drag.dy) / 8) * 8
        })
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

    onTouchEnd() { this.drag = null },

    draw() {
      if (!this.canvas || !this.box) return
      const ctx = this.canvas.getContext('2d')
      const { nodes, edges, selected, edgeType } = this.data
      const { width, height } = this.box

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.translate(this.view.x, this.view.y)
      ctx.scale(this.view.scale, this.view.scale)

      const byId = {}
      nodes.forEach((n) => (byId[n.id] = n))

      edges.forEach((edge) => {
        const from = byId[edge.from]
        const to = byId[edge.to]
        if (!from || !to) return
        const active = selected && (edge.from === selected || edge.to === selected)
        const a = anchorOf(from, {
          x: to.x + (to.width || NODE_W) / 2,
          y: to.y + (to.height || NODE_H) / 2
        })
        const b = anchorOf(to, {
          x: from.x + (from.width || NODE_W) / 2,
          y: from.y + (from.height || NODE_H) / 2
        })

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
        ctx.strokeStyle = node.id === selected ? '#5e7ce0' : stroke
        ctx.lineWidth = node.id === selected ? 2 : 1.5
        ctx.stroke()

        ctx.fillStyle = '#252b3a'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.label, node.x + w / 2, node.y + h / 2 + 5)
      })
    }
  }
})
