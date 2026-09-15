/**
 * ChartDistribution —— 直方 / 密度 / 小提琴 / 误差棒（astra.md 的 D04）。
 *
 * 分箱、核密度、误差棒的计算全走公共层，与 Web 端同一份：各端各算一遍的话，
 * 同一批样本在小程序上会画出另一个形状——而分布图的形状就是它的全部内容。
 *
 * 会改变结论的数字（箱宽、带宽、误差棒的含义）照样印在图下，不因为屏幕小就省掉。
 */
import { errorBar, formatTick, histogram, kde, niceTicks, violinShape } from '@i-design/common'

const PAD = { top: 12, right: 12, bottom: 28, left: 44 }

Component({
  options: { addGlobalClass: true },
  properties: {
    values: { type: Array, value: [] },
    type: { type: String, value: 'histogram' },
    rule: { type: String, value: 'freedman-diaconis' },
    binWidth: { type: Number, value: 0 },
    bandwidth: { type: Number, value: 0 },
    errorKind: { type: String, value: 'sd' },
    height: { type: Number, value: 220 },
    title: { type: String, value: '' },
    unit: { type: String, value: '' }
  },
  data: { caption: '', issues: [] },
  observers: {
    'values, type, rule, binWidth, bandwidth, errorKind': function () { this.draw() }
  },
  lifetimes: { attached() { this.draw() } },
  methods: {
    draw() {
      const query = this.createSelectorQuery()
      query.select('.i-chart-dist__canvas').fields({ node: true, size: true }).exec((res) => {
        const item = res && res[0]
        if (!item || !item.node) return
        const canvas = item.node
        const ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
        canvas.width = item.width * dpr
        canvas.height = item.height * dpr
        ctx.scale(dpr, dpr)
        this.render(ctx, item.width, item.height)
      })
    },

    render(ctx, width, height) {
      const { values, type, rule, binWidth, bandwidth, errorKind, unit } = this.data
      const samples = (values || []).filter((v) => Number.isFinite(v))
      ctx.clearRect(0, 0, width, height)

      const hist = type === 'histogram' ? histogram(samples, { rule, width: binWidth || undefined }) : null
      const density = type === 'density' ? kde(samples, { bandwidth: bandwidth || undefined }) : null
      const violin = type === 'violin' ? violinShape(samples, { bandwidth: bandwidth || undefined }) : null
      const bar = type === 'error' ? errorBar(samples, errorKind) : null

      const plotW = width - PAD.left - PAD.right
      const plotH = height - PAD.top - PAD.bottom

      let min = 0
      let max = 1
      if (samples.length) {
        min = Math.min.apply(null, samples)
        max = Math.max.apply(null, samples)
        if (bar) { min = Math.min(min, bar.low); max = Math.max(max, bar.high) }
        if (density && density.points.length) {
          min = density.points[0].x
          max = density.points[density.points.length - 1].x
        }
      }
      const ticks = niceTicks(min, max, 5)
      const lo = ticks[0]
      const hi = ticks[ticks.length - 1]
      const x = (v) => PAD.left + ((v - lo) / (hi - lo || 1)) * plotW

      ctx.strokeStyle = 'rgba(20,24,34,0.08)'
      ctx.lineWidth = 1
      ctx.font = '11px sans-serif'
      ctx.fillStyle = '#8a8e99'
      ctx.textAlign = 'center'
      ticks.forEach((tick) => {
        ctx.beginPath()
        ctx.moveTo(x(tick), PAD.top)
        ctx.lineTo(x(tick), PAD.top + plotH)
        ctx.stroke()
        ctx.fillText(formatTick(tick), x(tick), height - PAD.bottom + 16)
      })

      const color = '#5e7ce0'
      const mid = PAD.top + plotH / 2

      if (hist) {
        const maxCount = Math.max.apply(null, [1].concat(hist.bins.map((b) => b.count)))
        ctx.fillStyle = color
        hist.bins.forEach((bin) => {
          const h = (bin.count / maxCount) * plotH
          // 相邻箱之间留一像素缝：色觉障碍下它比颜色更可靠
          ctx.fillRect(x(bin.from) + 0.5, PAD.top + plotH - h, Math.max(1, x(bin.to) - x(bin.from) - 1), h)
        })
      } else if (density && density.points.length) {
        const peak = Math.max.apply(null, density.points.map((p) => p.y))
        ctx.beginPath()
        density.points.forEach((p, i) => {
          const py = PAD.top + plotH - (p.y / peak) * plotH
          if (i === 0) ctx.moveTo(x(p.x), py)
          else ctx.lineTo(x(p.x), py)
        })
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()
      } else if (violin && violin.points.length) {
        // 宽度按峰值归一化：两把琴的「胖」才可比，这正是小提琴最常被误读的地方
        const peak = violin.peak || 1
        ctx.beginPath()
        violin.points.forEach((p, i) => {
          const half = (p.density / peak) * (plotH / 2)
          if (i === 0) ctx.moveTo(x(p.value), mid - half)
          else ctx.lineTo(x(p.value), mid - half)
        })
        for (let i = violin.points.length - 1; i >= 0; i--) {
          const p = violin.points[i]
          ctx.lineTo(x(p.value), mid + (p.density / peak) * (plotH / 2))
        }
        ctx.closePath()
        ctx.globalAlpha = 0.28
        ctx.fillStyle = color
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else if (bar) {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x(bar.low), mid)
        ctx.lineTo(x(bar.high), mid)
        ctx.moveTo(x(bar.low), mid - 10)
        ctx.lineTo(x(bar.low), mid + 10)
        ctx.moveTo(x(bar.high), mid - 10)
        ctx.lineTo(x(bar.high), mid + 10)
        ctx.stroke()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x(bar.mean), mid, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      // 会改变结论的数字写在图下：箱宽、带宽、误差棒的含义
      let caption = ''
      if (hist) {
        const ruleName = hist.rule === 'freedman-diaconis' ? 'Freedman–Diaconis' : hist.rule === 'sturges' ? 'Sturges' : '固定宽度'
        caption = `${hist.count} 个样本，${hist.bins.length} 个箱，箱宽 ${formatTick(hist.width)}${unit}（${ruleName}）`
      } else if (density) {
        caption = `${samples.length} 个样本，带宽 ${formatTick(density.bandwidth)}${unit}（Silverman）`
      } else if (violin) {
        caption = `${samples.length} 个样本，带宽 ${formatTick(violin.bandwidth)}${unit}；宽度按峰值归一化`
      } else if (bar) {
        caption = bar.caption
      }
      const issues = []
        .concat(hist ? hist.issues : [])
        .concat(density ? density.issues : [])
        .concat(violin ? violin.issues : [])
      this.setData({ caption, issues })
    }
  }
})
