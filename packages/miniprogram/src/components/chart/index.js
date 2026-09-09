/**
 * Chart —— 折线 / 面积 / 柱状图。
 *
 * 小程序没有 SVG，只能画在 canvas 上；刻度、比例尺与格式化仍走公共层，
 * 因此同一份数据在小程序与 Web 上刻度完全一致，只是绘制手段不同。
 */
import { domainOf, formatTick, niceTicks, scaleX, scaleY } from '@i-design/common'

// 分类色与 Web 端同一批取值、同一个顺序；顺序本身就是色觉安全机制
const PALETTE = ['#5e7ce0', '#b7622a', '#0f8a68', '#7a4ee0', '#d64f8d', '#1f86b8', '#b08a1e', '#c2413d']

const PAD = { top: 12, right: 12, bottom: 24, left: 44 }

Component({
  options: { addGlobalClass: true },
  properties: {
    series: { type: Array, value: [] },
    labels: { type: Array, value: [] },
    type: { type: String, value: 'line' },
    stacked: { type: Boolean, value: false },
    height: { type: Number, value: 220 },
    fromZero: { type: Boolean, value: true },
    title: { type: String, value: '' }
  },
  data: { legend: [] },
  observers: {
    'series, labels, type, stacked': function (series) {
      this.setData({
        legend: series.map((s, i) => ({ name: s.name, color: PALETTE[i % PALETTE.length] }))
      })
      this.draw()
    }
  },
  lifetimes: {
    attached() { this.draw() }
  },
  methods: {
    draw() {
      const query = this.createSelectorQuery()
      query
        .select('.i-chart__canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const item = res && res[0]
          if (!item || !item.node) return
          const canvas = item.node
          const ctx = canvas.getContext('2d')
          // 按设备像素比放大画布再缩回来，否则在高密度屏上是糊的
          const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
          canvas.width = item.width * dpr
          canvas.height = item.height * dpr
          ctx.scale(dpr, dpr)
          this.render(ctx, item.width, item.height)
        })
    },

    render(ctx, width, height) {
      const { series, labels, type, stacked, fromZero } = this.data
      ctx.clearRect(0, 0, width, height)
      if (!series.length || !labels.length) return

      const isBar = type === 'bar'
      const stackedArea = type === 'area' && series.length > 1
      const plotW = width - PAD.left - PAD.right
      const plotH = height - PAD.top - PAD.bottom

      const domain = domainOf(series, {
        fromZero: isBar ? true : fromZero,
        stacked: (isBar && stacked) || stackedArea
      })
      const ticks = niceTicks(domain.min, domain.max, 5)
      const lo = ticks[0]
      const hi = ticks[ticks.length - 1]
      const y = (v) => scaleY(v, lo, hi, plotH) + PAD.top
      const x = (i) => scaleX(i, labels.length, plotW) + PAD.left

      // 网格与刻度：背景信息，最淡的一档
      ctx.strokeStyle = 'rgba(20,24,34,0.08)'
      ctx.lineWidth = 1
      ctx.font = '11px sans-serif'
      ctx.fillStyle = '#8a8e99'
      ctx.textAlign = 'right'
      ticks.forEach((tick) => {
        ctx.beginPath()
        ctx.moveTo(PAD.left, y(tick))
        ctx.lineTo(width - PAD.right, y(tick))
        ctx.stroke()
        ctx.fillText(formatTick(tick), PAD.left - 6, y(tick) + 4)
      })

      const band = plotW / Math.max(1, labels.length)
      ctx.textAlign = 'center'
      labels.forEach((label, i) => {
        if (labels.length > 8 && i % 2 === 1) return
        ctx.fillText(label, isBar ? PAD.left + band * (i + 0.5) : x(i), height - PAD.bottom + 14)
      })

      const below = (i, si) => series.slice(0, si).reduce((sum, s) => sum + (s.data[i] || 0), 0)

      if (isBar) {
        const barW = stacked ? band * 0.5 : (band * 0.62) / series.length
        series.forEach((s, si) => {
          ctx.fillStyle = PALETTE[si % PALETTE.length]
          s.data.forEach((value, i) => {
            const left = stacked
              ? PAD.left + band * i + (band - barW) / 2
              : PAD.left + band * i + (band - barW * series.length) / 2 + si * barW
            const top = stacked ? y(below(i, si) + value) : y(Math.max(0, value))
            const bottom = stacked ? y(below(i, si)) : y(0)
            ctx.fillRect(left, top, barW, bottom - top)
            // 相邻填充之间留缝隙：色觉障碍下比颜色更可靠
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.strokeRect(left, top, barW, bottom - top)
          })
        })
        return
      }

      series.forEach((s, si) => {
        const color = PALETTE[si % PALETTE.length]
        const upper = stackedArea ? s.data.map((v, i) => v + below(i, si)) : s.data

        if (type === 'area') {
          // 每层画成上下沿之间的带状区域，颜色才等于系列色而不是叠出来的混合色
          ctx.beginPath()
          upper.forEach((v, i) => (i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v))))
          if (stackedArea) {
            for (let i = upper.length - 1; i >= 0; i--) ctx.lineTo(x(i), y(below(i, si)))
          } else {
            ctx.lineTo(x(upper.length - 1), y(Math.max(lo, 0)))
            ctx.lineTo(x(0), y(Math.max(lo, 0)))
          }
          ctx.closePath()
          ctx.globalAlpha = 0.22
          ctx.fillStyle = color
          ctx.fill()
          ctx.globalAlpha = 1
        }

        ctx.beginPath()
        upper.forEach((v, i) => (i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v))))
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.stroke()
      })
    }
  }
})
