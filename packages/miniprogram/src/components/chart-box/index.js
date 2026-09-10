/**
 * ChartBox —— 箱线图。
 * 五数概括与离群点判定走共享的 boxStats：分位数有七八种定义，
 * 各端各挑一种就会得到不同的箱子。
 */
import { boxStats, formatTick, niceTicks, scaleY } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    groups: { type: Array, value: [] },
    title: { type: String, value: '' },
    height: { type: Number, value: 260 },
    unit: { type: String, value: '' }
  },
  data: { rows: [] },
  observers: { groups: function () { this.setData({ rows: this.summarize() }, () => this.draw()) } },
  lifetimes: { attached() { this.setData({ rows: this.summarize() }, () => this.draw()) } },
  methods: {
    summarize() {
      return this.data.groups.map((g) => {
        const s = boxStats(g.values)
        return {
          label: g.label,
          min: formatTick(s.min),
          q1: formatTick(s.q1),
          median: formatTick(s.median),
          q3: formatTick(s.q3),
          max: formatTick(s.max),
          outliers: s.outliers.length
        }
      })
    },

    draw() {
      const { groups, height, unit } = this.data
      if (!groups.length) return
      this.createSelectorQuery()
        .select('.i-chart__box-canvas')
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

          const PAD = { top: 16, right: 12, bottom: 28, left: 44 }
          const plotW = item.width - PAD.left - PAD.right
          const plotH = height - PAD.top - PAD.bottom
          const stats = groups.map((g) => boxStats(g.values))
          // 值域含离群点：裁掉它们，图上就看不出「有异常值」这件事
          const all = stats.reduce((acc, s) => acc.concat([s.min, s.max]), []).filter((v) => isFinite(v))
          const ticks = niceTicks(Math.min.apply(null, all), Math.max.apply(null, all), 5)
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

          const band = plotW / groups.length
          const boxW = Math.min(48, band * 0.5)
          // 单一色相：每个箱子都是同一件事（一个分布），分类色会让人以为颜色有含义
          const stroke = '#5e7ce0'
          stats.forEach((s, i) => {
            const cx = PAD.left + band * (i + 0.5)
            ctx.strokeStyle = stroke
            ctx.lineWidth = 1.5
            // 须：到 1.5×IQR 内的实测值
            ctx.beginPath()
            ctx.moveTo(cx, y(s.upper)); ctx.lineTo(cx, y(s.q3))
            ctx.moveTo(cx, y(s.q1)); ctx.lineTo(cx, y(s.lower))
            ctx.moveTo(cx - boxW / 4, y(s.upper)); ctx.lineTo(cx + boxW / 4, y(s.upper))
            ctx.moveTo(cx - boxW / 4, y(s.lower)); ctx.lineTo(cx + boxW / 4, y(s.lower))
            ctx.stroke()

            ctx.fillStyle = '#eef3ff'
            ctx.fillRect(cx - boxW / 2, y(s.q3), boxW, Math.max(1, y(s.q1) - y(s.q3)))
            ctx.strokeRect(cx - boxW / 2, y(s.q3), boxW, Math.max(1, y(s.q1) - y(s.q3)))

            // 中位线加粗：箱子里唯一需要一眼读出的位置
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(cx - boxW / 2, y(s.median)); ctx.lineTo(cx + boxW / 2, y(s.median))
            ctx.stroke()

            // 离群点空心：它们本就是「例外」，实心会和箱体抢注意力
            ctx.lineWidth = 1.5
            ctx.fillStyle = '#ffffff'
            for (const o of s.outliers) {
              ctx.beginPath()
              ctx.arc(cx, y(o), 3, 0, Math.PI * 2)
              ctx.fill()
              ctx.stroke()
            }

            ctx.fillStyle = '#86909c'
            ctx.textAlign = 'center'
            ctx.fillText(groups[i].label, cx, height - 12)
          })
        })
    }
  }
})
