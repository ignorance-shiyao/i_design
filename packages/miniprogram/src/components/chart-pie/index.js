/**
 * ChartPie —— 占比图。
 *
 * 默认环形而不是实心饼：读者比较的是弧长，比面积更容易读准。
 * 数值写在图例上而不是扇区里——扇区一小就会互相压字。
 */
import { formatTick } from '@i-design/common'

const PALETTE = ['#5e7ce0', '#b7622a', '#0f8a68', '#7a4ee0', '#d64f8d', '#1f86b8', '#b08a1e', '#c2413d']

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    donut: { type: Boolean, value: true },
    size: { type: Number, value: 160 },
    title: { type: String, value: '' },
    centerLabel: { type: String, value: '' },
    unit: { type: String, value: '' }
  },
  data: { rows: [], totalText: '' },
  observers: {
    items: function (items) {
      const total = items.reduce((sum, i) => sum + Math.max(0, i.value), 0)
      this.setData({
        totalText: formatTick(total),
        rows: items.map((item, index) => ({
          ...item,
          color: PALETTE[index % PALETTE.length],
          valueText: formatTick(item.value),
          percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
        }))
      })
      this.draw()
    }
  },
  lifetimes: {
    attached() { this.draw() }
  },
  methods: {
    draw() {
      this.createSelectorQuery()
        .select('.i-chart__pie-canvas')
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

          const { items, donut } = this.data
          const total = items.reduce((sum, i) => sum + Math.max(0, i.value), 0)
          if (total <= 0) return

          const radius = item.width / 2
          const inner = donut ? radius * 0.62 : 0
          let angle = -Math.PI / 2 // 从 12 点方向开始，与阅读习惯一致

          ctx.clearRect(0, 0, item.width, item.height)
          items.forEach((slice, index) => {
            const sweep = (Math.max(0, slice.value) / total) * Math.PI * 2
            ctx.beginPath()
            ctx.arc(radius, radius, radius, angle, angle + sweep)
            if (inner > 0) ctx.arc(radius, radius, inner, angle + sweep, angle, true)
            else ctx.lineTo(radius, radius)
            ctx.closePath()
            ctx.fillStyle = PALETTE[index % PALETTE.length]
            ctx.fill()
            // 扇区之间的缝隙用底色描边画出来
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.stroke()
            angle += sweep
          })
        })
    }
  }
})
