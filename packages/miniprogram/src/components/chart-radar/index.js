/**
 * ChartRadar —— 雷达图。
 *
 * 与 Web 端共用 radarPoints：蛛网、轴线、数据多边形的几何全部来自同一份计算，
 * 两端不会因为各写一遍三角函数而对不上。
 */
import { radarPoints } from '@i-design/common'

const PALETTE = ['#5e7ce0', '#b7622a', '#0f8a68', '#7a4ee0', '#d64f8d', '#1f86b8', '#b08a1e', '#c2413d']
const RINGS = [0.25, 0.5, 0.75, 1]

Component({
  options: { addGlobalClass: true },
  properties: {
    axes: { type: Array, value: [] },
    series: { type: Array, value: [] },
    max: { type: Number, value: 0 },
    size: { type: Number, value: 240 },
    title: { type: String, value: '' }
  },
  data: { legend: [] },
  observers: {
    'axes, series, max, size': function () {
      this.setData({
        legend: this.data.series.map((s, i) => ({ name: s.name, color: PALETTE[i % PALETTE.length] }))
      })
      this.draw()
    }
  },
  lifetimes: { attached() { this.draw() } },
  methods: {
    draw() {
      const { axes, series, size } = this.data
      if (!axes.length || !series.length) return
      this.createSelectorQuery()
        .select('.i-chart__radar-canvas')
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

          // 半径要给维度名让位，否则最右侧的名字会被画布裁掉
          const longest = Math.max(4, ...axes.map((a) => a.length))
          const reserve = Math.min(size * 0.28, longest * 12)
          const radius = size / 2 - reserve - 12
          const maxValue = this.data.max || Math.max(1, ...series.reduce((all, s) => all.concat(s.data), []))
          const ox = size / 2 - radius
          const oy = size / 2 - radius

          const stroke = (points, close) => {
            ctx.beginPath()
            points.forEach((p, i) => (i ? ctx.lineTo(ox + p.x, oy + p.y) : ctx.moveTo(ox + p.x, oy + p.y)))
            if (close) ctx.closePath()
            ctx.stroke()
          }

          // 蛛网：等分同心多边形，比同心圆更容易读出「落在第几档」
          ctx.lineWidth = 1
          ctx.strokeStyle = '#e5e6eb'
          for (const ring of RINGS) {
            stroke(radarPoints(axes.map(() => maxValue * ring), maxValue, radius), true)
          }
          const axisEnds = radarPoints(axes.map(() => maxValue), maxValue, radius)
          for (const point of axisEnds) {
            ctx.beginPath()
            ctx.moveTo(ox + radius, oy + radius)
            ctx.lineTo(ox + point.axisX, oy + point.axisY)
            ctx.stroke()
          }

          // 多系列只描边不填充：两层半透明叠出的混合色没法对回图例
          series.forEach((s, index) => {
            const color = PALETTE[index % PALETTE.length]
            const points = radarPoints(s.data, maxValue, radius)
            ctx.lineWidth = 2
            ctx.lineJoin = 'round'
            ctx.strokeStyle = color
            if (series.length === 1) {
              ctx.beginPath()
              points.forEach((p, i) => (i ? ctx.lineTo(ox + p.x, oy + p.y) : ctx.moveTo(ox + p.x, oy + p.y)))
              ctx.closePath()
              ctx.globalAlpha = 0.18
              ctx.fillStyle = color
              ctx.fill()
              ctx.globalAlpha = 1
              ctx.stroke()
            } else {
              stroke(points, true)
            }
            ctx.fillStyle = color
            for (const p of points) {
              ctx.beginPath()
              ctx.arc(ox + p.x, oy + p.y, 3, 0, Math.PI * 2)
              ctx.fill()
            }
          })

          // 维度名排在轴外侧，按所处方位决定对齐，避免超出画布
          ctx.fillStyle = '#86909c'
          ctx.font = '11px sans-serif'
          ctx.textBaseline = 'middle'
          axes.forEach((axis, i) => {
            const angle = -Math.PI / 2 + (i / axes.length) * Math.PI * 2
            const cos = Math.cos(angle)
            ctx.textAlign = Math.abs(cos) < 0.2 ? 'center' : cos > 0 ? 'left' : 'right'
            ctx.fillText(
              axis,
              size / 2 + (radius + 14) * cos,
              size / 2 + (radius + 14) * Math.sin(angle)
            )
          })
        })
    }
  }
})
