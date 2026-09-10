/**
 * ChartWaterfall —— 瀑布图。
 * 柱子的起止值走共享的 waterfallBars，各端不会在「这根接在哪里」上分叉。
 */
import { formatTick, niceTicks, scaleY, waterfallBars, waterfallDomain } from '@i-design/common'

/*
 * 涨跌用双向色阶的两端，而不是状态色的绿/红：
 * 收入增加是好事、成本增加是坏事，「增加」这个方向本身没有好坏。
 * 小程序 canvas 取不到 CSS 变量，只能写成常量——值与令牌保持一致。
 */
const COLOR = { increase: '#3a4da3', decrease: '#c2413d', total: '#8a8e99' }

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    title: { type: String, value: '' },
    height: { type: Number, value: 280 },
    unit: { type: String, value: '' }
  },
  data: { rows: [] },
  observers: { items: function () { this.refresh() } },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const bars = waterfallBars(this.data.items)
      this.setData({
        rows: bars.map((b) => ({
          label: b.label,
          delta: b.kind === 'total' ? '—' : (b.delta > 0 ? '+' : '') + formatTick(b.delta),
          end: formatTick(b.end)
        }))
      }, () => this.draw())
    },

    draw() {
      const { items, height, unit } = this.data
      if (!items.length) return
      this.createSelectorQuery()
        .select('.i-chart__wf-canvas')
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

          const PAD = { top: 24, right: 12, bottom: 40, left: 50 }
          const plotW = item.width - PAD.left - PAD.right
          const plotH = height - PAD.top - PAD.bottom
          const bars = waterfallBars(items)
          const domain = waterfallDomain(bars)
          const ticks = niceTicks(domain[0], domain[1], 5)
          const lo = ticks[0]
          const hi = ticks[ticks.length - 1]
          const y = (v) => scaleY(v, lo, hi, plotH) + PAD.top

          ctx.strokeStyle = '#e5e6eb'
          ctx.lineWidth = 1
          ctx.fillStyle = '#86909c'
          ctx.font = '11px sans-serif'
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'right'
          for (const tick of ticks) {
            ctx.beginPath()
            ctx.moveTo(PAD.left, y(tick))
            ctx.lineTo(item.width - PAD.right, y(tick))
            ctx.stroke()
            ctx.fillText(formatTick(tick) + unit, PAD.left - 6, y(tick))
          }
          // 零线加重：回到零在瀑布图里是有意义的位置
          ctx.strokeStyle = '#c3c6cd'
          ctx.beginPath()
          ctx.moveTo(PAD.left, y(0))
          ctx.lineTo(item.width - PAD.right, y(0))
          ctx.stroke()

          const band = plotW / bars.length
          const barW = Math.min(40, band * 0.62)
          const left = (i) => PAD.left + band * i + (band - barW) / 2

          // 连接线：把上一根的终点引到下一根的起点，这是瀑布图区别于柱状图之处
          ctx.strokeStyle = '#dfe1e6'
          ctx.setLineDash([3, 3])
          for (let i = 0; i < bars.length - 1; i++) {
            ctx.beginPath()
            ctx.moveTo(left(i) + barW, y(bars[i].end))
            ctx.lineTo(left(i + 1), y(bars[i].end))
            ctx.stroke()
          }
          ctx.setLineDash([])

          bars.forEach((bar, i) => {
            ctx.fillStyle = COLOR[bar.kind]
            const top = Math.min(y(bar.start), y(bar.end))
            const h = Math.max(2, Math.abs(y(bar.end) - y(bar.start)))
            ctx.fillRect(left(i), top, barW, h)

            // 增减量直接标在柱子上：瀑布图的读者要的就是这个数
            ctx.fillStyle = '#575d6c'
            ctx.textAlign = 'center'
            const text = bar.kind === 'total'
              ? formatTick(bar.end)
              : (bar.delta > 0 ? '+' : '') + formatTick(bar.delta)
            ctx.fillText(text, left(i) + barW / 2, top - 8)

            ctx.fillStyle = '#86909c'
            ctx.fillText(bar.label, left(i) + barW / 2, height - 18)
          })
        })
    }
  }
})
