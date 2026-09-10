/**
 * ChartSankey —— 桑基图。
 * 分层、节点高度、缎带几何全部来自共享的 sankeyLayout，
 * 这里只把坐标交给 canvas，各端不会在「谁在第几层」上分叉。
 */
import { chartCategorical, formatTick, sankeyLayout } from '@i-design/common'

/*
 * 节点是「身份」，用分类色按顺序分配，超过 8 个不再循环（第 9 个起画成中性灰）。
 * canvas 取不到 CSS 变量，所以直接读令牌常量——照抄色值迟早会与令牌对不上。
 */
const NEUTRAL = '#8a8e99'

Component({
  options: { addGlobalClass: true },
  properties: {
    links: { type: Array, value: [] },
    labels: { type: Object, value: {} },
    title: { type: String, value: '' },
    height: { type: Number, value: 300 },
    unit: { type: String, value: '' }
  },
  data: { rows: [] },
  observers: { links: function () { this.refresh() } },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const labels = this.data.labels || {}
      const unit = this.data.unit
      this.setData({
        rows: (this.data.links || []).map((l, i) => ({
          key: i,
          from: labels[l.from] || l.from,
          to: labels[l.to] || l.to,
          value: formatTick(l.value) + unit
        }))
      }, () => this.draw())
    },

    draw() {
      const { links, labels, height, unit } = this.data
      if (!links.length) return
      this.createSelectorQuery()
        .select('.i-chart__sankey-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const item = res && res[0]
          if (!item || !item.node) return
          const canvas = item.node
          const ctx = canvas.getContext('2d')
          const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
          canvas.width = item.width * dpr
          canvas.height = item.height * dpr
          ctx.scale(dpr, dpr)
          ctx.clearRect(0, 0, item.width, item.height)

          // 右侧留白给节点名，不留就会被画布边缘裁掉
          const PAD = { top: 12, right: 96, bottom: 12, left: 12 }
          const layout = sankeyLayout(
            links,
            item.width - PAD.left - PAD.right,
            height - PAD.top - PAD.bottom,
            { labels: labels || {} }
          )
          const colorOf = (key) => {
            const index = layout.nodes.findIndex((n) => n.key === key)
            return index >= 0 && index < chartCategorical.length ? chartCategorical[index] : NEUTRAL
          }

          ctx.translate(PAD.left, PAD.top)

          // 缎带先画、节点后画：节点压在上面才能盖住收口处的接缝
          ctx.globalAlpha = 0.42
          for (const ribbon of layout.ribbons) {
            const s = ribbon.source
            const t = ribbon.target
            const cx = ribbon.controlX
            ctx.fillStyle = colorOf(ribbon.from)
            ctx.beginPath()
            ctx.moveTo(s.x, s.top)
            ctx.bezierCurveTo(cx, s.top, cx, t.top, t.x, t.top)
            ctx.lineTo(t.x, t.bottom)
            ctx.bezierCurveTo(cx, t.bottom, cx, s.bottom, s.x, s.bottom)
            ctx.closePath()
            ctx.fill()
          }
          ctx.globalAlpha = 1

          ctx.font = '11px sans-serif'
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'left'
          for (const node of layout.nodes) {
            ctx.fillStyle = colorOf(node.key)
            ctx.fillRect(node.x, node.y, node.width, node.height)
            // 桑基图没有坐标轴，名称与流量不标在节点旁就读不出量
            ctx.fillStyle = '#575d6c'
            ctx.fillText(
              node.label + ' ' + formatTick(node.value) + unit,
              node.x + node.width + 6,
              node.y + node.height / 2
            )
          }
        })
    }
  }
})
