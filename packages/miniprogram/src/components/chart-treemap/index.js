/**
 * ChartTreemap —— 矩形树图。
 * 布局走共享的 treemapLayout（squarify），各端切出来的块完全一致。
 */
import { chartSequential, contrastText, formatTick, treemapLayout } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    title: { type: String, value: '' },
    height: { type: Number, value: 300 },
    unit: { type: String, value: '' }
  },
  data: { rows: [] },
  observers: { items: function () { this.refresh() } },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const unit = this.data.unit
      const total = (this.data.items || []).reduce((s, i) => s + i.value, 0) || 1
      this.setData({
        rows: (this.data.items || []).map((i) => ({
          label: i.label,
          value: formatTick(i.value) + unit,
          percent: Math.round((i.value / total) * 100) + '%'
        }))
      }, () => this.draw())
    },

    draw() {
      const { items, height, unit } = this.data
      if (!items.length) return
      this.createSelectorQuery()
        .select('.i-chart__treemap-canvas')
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

          const tiles = treemapLayout(items, item.width, height)
          const max = Math.max.apply(null, items.map((i) => i.value).concat([1]))
          const total = items.reduce((s, i) => s + i.value, 0) || 1

          /*
           * 块表达的是「多少」而不是「谁」，因此用单色顺序色阶：
           * 分类色会让人以为颜色另有含义，而面积已经在表达量级了。
           */
          const stepOf = (percent) => {
            const ratio = (percent * total) / max
            return Math.min(4, Math.max(0, Math.round(ratio * 4)))
          }

          ctx.textBaseline = 'middle'
          ctx.textAlign = 'left'
          for (const tile of tiles) {
            const step = stepOf(tile.percent)
            ctx.fillStyle = chartSequential[step]
            ctx.fillRect(tile.x + 1, tile.y + 1, Math.max(0, tile.width - 2), Math.max(0, tile.height - 2))

            // 小块放不下文字：塞进去会溢出到相邻块上，看起来像标错了
            if (tile.width > 56 && tile.height > 34) {
              // 文字压在色块上，颜色跟随该档的对比色——深色档上的深字读不出来
              const ink = contrastText(chartSequential[step])
              ctx.fillStyle = ink
              ctx.font = '13px sans-serif'
              ctx.fillText(tile.label, tile.x + 10, tile.y + 18)
              ctx.globalAlpha = 0.72
              ctx.font = '11px sans-serif'
              ctx.fillText(
                formatTick(tile.value) + unit + ' · ' + Math.round(tile.percent * 100) + '%',
                tile.x + 10,
                tile.y + 34
              )
              ctx.globalAlpha = 1
            }
          }
        })
    }
  }
})
