/**
 * ChartZoom —— 区间缩放条。
 *
 * 窗口的夹取、交叉、平移都走共享逻辑：手柄拖过头要交换、
 * 到边界只停住不压缩，这些判断各端分头写必然分叉。
 */
import { clampWindow, panWindow, windowFromRatio, windowRatio } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    values: { type: Array, value: [] },
    labels: { type: Array, value: [] },
    minSpan: { type: Number, value: 3 },
    height: { type: Number, value: 48 },
    window: { type: Object, value: null }
  },
  data: { left: '0%', width: '100%', rangeText: '' },
  observers: {
    'values, window': function () { this.refresh() }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    current() {
      const count = this.data.values.length
      const w = this.data.window || { start: 0, end: Math.max(0, count - 1) }
      return clampWindow(w, count, this.data.minSpan)
    },

    refresh() {
      const count = this.data.values.length
      if (!count) return
      const w = this.current()
      const r = windowRatio(w, count)
      const labels = this.data.labels
      this.setData({
        left: (r.from * 100).toFixed(2) + '%',
        width: ((r.to - r.from) * 100).toFixed(2) + '%',
        rangeText: labels.length
          ? (labels[w.start] || '') + ' – ' + (labels[w.end] || '')
          : (w.start + 1) + ' – ' + (w.end + 1)
      })
      this.draw()
    },

    draw() {
      const { values, height } = this.data
      if (values.length < 2) return
      this.createSelectorQuery()
        .select('.i-zoom__canvas')
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

          // 缩略走势只表达形状：它的作用是让人知道自己拖到了哪一段
          const min = Math.min.apply(null, values)
          const max = Math.max.apply(null, values)
          const span = max - min || 1
          ctx.strokeStyle = '#8a8e99'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          values.forEach((v, i) => {
            const x = (i / (values.length - 1)) * item.width
            const y = height - 6 - ((v - min) / span) * (height - 12)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.stroke()
        })
    },

    onTrack(event) {
      // 小程序没有 pointer capture，用触点在轨道内的比例直接定位手柄
      const touch = event.touches && event.touches[0]
      if (!touch) return
      this.createSelectorQuery()
        .select('.i-zoom__track')
        .boundingClientRect((rect) => {
          if (!rect) return
          const ratio = Math.min(1, Math.max(0, (touch.clientX - rect.left) / rect.width))
          const count = this.data.values.length
          const w = this.current()
          const r = windowRatio(w, count)
          // 离哪一端近就拖哪一端；中间则整体平移
          const dLeft = Math.abs(ratio - r.from)
          const dRight = Math.abs(ratio - r.to)
          let next
          if (Math.min(dLeft, dRight) > (r.to - r.from) / 4) {
            const center = (r.from + r.to) / 2
            next = panWindow(w, (ratio - center) * Math.max(1, count - 1), count)
          } else if (dLeft < dRight) {
            next = windowFromRatio(ratio, r.to, count, this.data.minSpan)
          } else {
            next = windowFromRatio(r.from, ratio, count, this.data.minSpan)
          }
          this.triggerEvent('change', { window: next })
        })
        .exec()
    },

    onReset() {
      const count = this.data.values.length
      this.triggerEvent('change', {
        window: clampWindow({ start: 0, end: count - 1 }, count, this.data.minSpan)
      })
    }
  }
})
