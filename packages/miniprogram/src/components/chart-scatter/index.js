/**
 * ChartScatter —— 散点 / 气泡图。
 *
 * 系列上限 3：散点里任意两点都可能贴着，配色要按所有两两组合校验，
 * 本体系的分类色在这个更严的口径下只有前三槽同时通过亮暗两种模式。
 * 超出的系列合并成「其他」，不再取第四个颜色。
 */
import { getLocale } from '../../config'

import { bubbleRadius, extentOf, formatTick, niceTicks, trendLine } from '@i-design/common'

const PALETTE = ['#5e7ce0', '#b7622a', '#0f8a68']
const MAX_SERIES = 3
const PAD = { top: 12, right: 14, bottom: 30, left: 46 }

Component({
  options: { addGlobalClass: true },
  properties: {
    series: { type: Array, value: [] },
    xLabel: { type: String, value: '' },
    yLabel: { type: String, value: '' },
    xUnit: { type: String, value: '' },
    yUnit: { type: String, value: '' },
    title: { type: String, value: '' },
    height: { type: Number, value: 240 },
    trend: { type: Boolean, value: false }
  },
  data: { legend: [], rows: [] },
  observers: {
    'series, trend': function () {
      const shown = this.shown()
      this.setData({
        legend: shown.map((s, i) => ({ name: s.name, color: PALETTE[i % MAX_SERIES] })),
        // 数据表：画布里的坐标读屏读不出来，表格是唯一能读到的形式
        rows: shown.reduce(
          (all, s) =>
            all.concat(
              s.data.map((p) => ({
                name: p.label || s.name,
                x: formatTick(p.x),
                y: formatTick(p.y)
              }))
            ),
          []
        )
      })
      this.draw()
    }
  },
  lifetimes: { attached() { this.draw() } },
  methods: {
    shown() {
      const series = this.data.series
      if (series.length <= MAX_SERIES) return series
      const head = series.slice(0, MAX_SERIES - 1)
      const rest = series.slice(MAX_SERIES - 1)
      return head.concat([
        { name: getLocale().chartOther, data: rest.reduce((all, s) => all.concat(s.data), []) }
      ])
    },
    draw() {
      const shown = this.shown()
      if (!shown.length) return
      this.createSelectorQuery()
        .select('.i-chart__scatter-canvas')
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

          const points = shown.reduce((all, s) => all.concat(s.data), [])
          if (!points.length) return
          const plotW = item.width - PAD.left - PAD.right
          const plotH = item.height - PAD.top - PAD.bottom
          const xE = extentOf(points, 'x')
          const yE = extentOf(points, 'y')
          const xTicks = niceTicks(xE.min, xE.max, 5)
          const yTicks = niceTicks(yE.min, yE.max, 5)
          const xMin = xTicks[0]
          const xMax = xTicks[xTicks.length - 1]
          const yMin = yTicks[0]
          const yMax = yTicks[yTicks.length - 1]
          const px = (v) => PAD.left + ((v - xMin) / (xMax - xMin)) * plotW
          const py = (v) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH

          // 两个方向都要网格：散点要同时读出横纵两个坐标
          ctx.strokeStyle = '#e5e6eb'
          ctx.lineWidth = 1
          ctx.fillStyle = '#86909c'
          ctx.font = '10px sans-serif'
          ctx.textBaseline = 'middle'
          yTicks.forEach((tick) => {
            ctx.beginPath()
            ctx.moveTo(PAD.left, py(tick))
            ctx.lineTo(item.width - PAD.right, py(tick))
            ctx.stroke()
            ctx.textAlign = 'right'
            ctx.fillText(formatTick(tick), PAD.left - 6, py(tick))
          })
          ctx.textAlign = 'center'
          xTicks.forEach((tick) => {
            ctx.beginPath()
            ctx.moveTo(px(tick), PAD.top)
            ctx.lineTo(px(tick), PAD.top + plotH)
            ctx.stroke()
            ctx.fillText(formatTick(tick), px(tick), PAD.top + plotH + 12)
          })
          if (this.data.xLabel) {
            ctx.fillText(this.data.xLabel + this.data.xUnit, PAD.left + plotW / 2, item.height - 8)
          }

          const sized = points.filter((p) => p.size !== undefined)
          const sizeE = extentOf(sized, 'size')

          shown.forEach((s, i) => {
            const color = PALETTE[i % MAX_SERIES]

            // 拟合线画在点之下：它是参考，不该盖住数据
            if (this.data.trend) {
              const fit = trendLine(s.data)
              if (fit) {
                ctx.save()
                // 裁到绘图区内：不裁的话斜率大的拟合线会冲出网格
                ctx.beginPath()
                ctx.rect(PAD.left, PAD.top, plotW, plotH)
                ctx.clip()
                ctx.setLineDash([6, 4])
                ctx.strokeStyle = color
                ctx.lineWidth = 1.5
                ctx.globalAlpha = 0.7
                ctx.beginPath()
                ctx.moveTo(px(xMin), py(fit.slope * xMin + fit.intercept))
                ctx.lineTo(px(xMax), py(fit.slope * xMax + fit.intercept))
                ctx.stroke()
                ctx.restore()
              }
            }

            s.data.forEach((point) => {
              const r = point.size === undefined ? 5 : bubbleRadius(point.size, sizeE.min, sizeE.max)
              ctx.beginPath()
              ctx.arc(px(point.x), py(point.y), r, 0, Math.PI * 2)
              ctx.fillStyle = color
              ctx.fill()
              // 描一圈背景色：点密集时重叠处会糊成一块，有缝隙才数得清
              ctx.strokeStyle = '#ffffff'
              ctx.lineWidth = 2
              ctx.stroke()
            })
          })
        })
    }
  }
})
