/**
 * Sparkline —— 嵌在指标卡或列表行里的走势图。
 * 不带坐标轴，也因此不从零起——形状才是它的信息。
 */
import { domainOf, scaleX, scaleY } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    data: { type: Array, value: [] },
    width: { type: Number, value: 96 },
    height: { type: Number, value: 28 },
    tone: { type: String, value: 'brand' },
    area: { type: Boolean, value: true },
    showLast: { type: Boolean, value: true }
  },
  observers: {
    'data, tone': function () { this.draw() }
  },
  lifetimes: {
    attached() { this.draw() }
  },
  methods: {
    colorOf() {
      const map = { brand: '#5e7ce0', success: '#3ac295', danger: '#f66f6a', neutral: '#8a8e99' }
      return map[this.data.tone] || map.brand
    },
    draw() {
      this.createSelectorQuery()
        .select('.i-sparkline__canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const item = res && res[0]
          if (!item || !item.node || this.data.data.length < 2) return
          const canvas = item.node
          const ctx = canvas.getContext('2d')
          const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
          canvas.width = item.width * dpr
          canvas.height = item.height * dpr
          ctx.scale(dpr, dpr)

          const { data, area, showLast } = this.data
          const w = item.width
          const h = item.height
          const domain = domainOf([{ name: '', data }], { fromZero: false })
          const color = this.colorOf()
          const px = (i) => scaleX(i, data.length, w)
          const py = (v) => scaleY(v, domain.min, domain.max, h)

          ctx.clearRect(0, 0, w, h)

          if (area) {
            ctx.beginPath()
            data.forEach((v, i) => (i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v))))
            ctx.lineTo(w, h)
            ctx.lineTo(0, h)
            ctx.closePath()
            ctx.globalAlpha = 0.14
            ctx.fillStyle = color
            ctx.fill()
            ctx.globalAlpha = 1
          }

          ctx.beginPath()
          data.forEach((v, i) => (i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v))))
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5
          ctx.lineJoin = 'round'
          ctx.lineCap = 'round'
          ctx.stroke()

          if (showLast) {
            ctx.beginPath()
            ctx.arc(px(data.length - 1), py(data[data.length - 1]), 2.5, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
          }
        })
    }
  }
})
