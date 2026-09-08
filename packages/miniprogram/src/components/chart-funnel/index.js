/**
 * ChartFunnel —— 转化漏斗。
 * 层宽按数值比例缩，不做等差递减；层级有序，因此用单色阶而不是分类色。
 */
import { formatTick, funnelShapes } from '@i-design/common'

const SEQ = ['#eef3ff', '#adc4ff', '#7ea1ff', '#5e7ce0', '#3a4da3']

Component({
  options: { addGlobalClass: true },
  properties: {
    stages: { type: Array, value: [] },
    title: { type: String, value: '' },
    unit: { type: String, value: '' },
    height: { type: Number, value: 200 }
  },
  data: { rows: [] },
  observers: {
    stages: function (stages) {
      const shapes = funnelShapes(stages.map((s) => s.value), 300, this.data.height)
      this.setData({
        rows: stages.map((stage, index) => ({
          ...stage,
          color: SEQ[Math.min(4, index)],
          valueText: formatTick(stage.value),
          // 漏斗要回答「在哪一步流失最多」，所以写的是相对上一层的转化率
          stepText: index === 0 ? '起点' : `较上一步 ${(shapes[index].step * 100).toFixed(1)}%`
        }))
      })
      this.draw()
    }
  },
  lifetimes: { attached() { this.draw() } },
  methods: {
    draw() {
      this.createSelectorQuery()
        .select('.i-chart__funnel-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const item = res && res[0]
          if (!item || !item.node || !this.data.stages.length) return
          const canvas = item.node
          const ctx = canvas.getContext('2d')
          const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
          canvas.width = item.width * dpr
          canvas.height = item.height * dpr
          ctx.scale(dpr, dpr)
          ctx.clearRect(0, 0, item.width, item.height)

          const shapes = funnelShapes(
            this.data.stages.map((s) => s.value),
            item.width,
            item.height
          )
          shapes.forEach((shape, index) => {
            const pts = shape.points.split(' ').map((p) => p.split(',').map(Number))
            ctx.beginPath()
            pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
            ctx.closePath()
            ctx.fillStyle = SEQ[Math.min(4, index)]
            ctx.fill()
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.stroke()
          })
        })
    }
  }
})
