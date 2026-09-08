/**
 * ChartGauge —— 仪表盘。
 * 开口朝下的 270°：整圆会让满值与零值落在同一位置，无法分辨。
 */
import { formatTick } from '@i-design/common'

const START = Math.PI * 0.75
const SWEEP = Math.PI * 1.5
const STATUS = { success: '#3ac295', warning: '#fa9841', danger: '#f66f6a' }

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: Number, value: 0 },
    min: { type: Number, value: 0 },
    max: { type: Number, value: 100 },
    size: { type: Number, value: 160 },
    title: { type: String, value: '' },
    unit: { type: String, value: '' },
    thresholds: { type: Array, value: [] }
  },
  data: { valueText: '', rangeText: '', color: '#5e7ce0' },
  observers: {
    'value, min, max, thresholds': function (value, min, max, thresholds) {
      const hit = [...thresholds]
        .sort((a, b) => a.value - b.value)
        .filter((t) => value >= t.value)
        .pop()
      this.setData({
        valueText: formatTick(value),
        rangeText: `${formatTick(min)} – ${formatTick(max)}`,
        color: hit ? STATUS[hit.status] || '#5e7ce0' : '#5e7ce0'
      })
      this.draw()
    }
  },
  lifetimes: { attached() { this.draw() } },
  methods: {
    draw() {
      this.createSelectorQuery()
        .select('.i-chart__gauge-canvas')
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

          const { value, min, max } = this.data
          const percent = max === min ? 0 : Math.min(1, Math.max(0, (value - min) / (max - min)))
          const stroke = Math.max(8, item.width * 0.09)
          const r = item.width / 2 - stroke / 2
          const cx = item.width / 2
          const cy = item.width / 2

          ctx.clearRect(0, 0, item.width, item.height)
          ctx.lineCap = 'round'
          ctx.lineWidth = stroke

          ctx.beginPath()
          ctx.arc(cx, cy, r, START, START + SWEEP)
          ctx.strokeStyle = '#eef0f5'
          ctx.stroke()

          if (percent > 0) {
            ctx.beginPath()
            ctx.arc(cx, cy, r, START, START + SWEEP * percent)
            ctx.strokeStyle = this.data.color
            ctx.stroke()
          }
        })
    }
  }
})
