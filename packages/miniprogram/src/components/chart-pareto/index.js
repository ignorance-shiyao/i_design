/** 只消费 common 生成的模型；Canvas 只做坐标映射，不重新统计。 */
Component({
  options: { addGlobalClass: true },
  properties: {
    model: { type: Object, value: null },
    title: { type: String, value: '帕累托图' },
    selectedId: { type: String, value: '' },
    height: { type: Number, value: 220 }
  },
  observers: { 'model, selectedId, height': function () { wx.nextTick(() => this.draw()) } },
  lifetimes: {
    ready() { this._themeChange = () => wx.nextTick(() => this.draw()); if (wx.onThemeChange) wx.onThemeChange(this._themeChange); this.draw() },
    detached() { if (wx.offThemeChange && this._themeChange) wx.offThemeChange(this._themeChange) }
  },
  pageLifetimes: { show() { this.draw() }, resize() { this.draw() } },
  methods: {
    select(event) { this.triggerEvent('select', { id: event.currentTarget.dataset.id }) },
    draw() {
      if (!this.data.model || this.data.model.state !== 'ready') return
      const query = this.createSelectorQuery()
      query.select('.i-pareto__plot').fields({ node: true, size: true })
      query.select('.i-pareto__palette').fields({ computedStyle: ['color', 'background-color', 'border-top-color'] })
      query.exec(result => {
        const item = result[0], colors = result[1]
        if (!item || !item.node || !colors) return
        const canvas = item.node, ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 1
        canvas.width = item.width * dpr; canvas.height = item.height * dpr; ctx.scale(dpr, dpr)
        const { rows, threshold } = this.data.model, w = item.width, h = item.height
        ctx.clearRect(0, 0, w, h)
        ctx.strokeStyle = colors['border-top-color']; ctx.lineWidth = 1
        for (const y of [0, .25, .5, .75, 1]) { ctx.beginPath(); ctx.moveTo(0, y * h); ctx.lineTo(w, y * h); ctx.stroke() }
        ctx.fillStyle = colors['background-color']
        rows.forEach(row => ctx.fillRect((row.rank - .9) * w / rows.length, (1 - row.relative) * h, .8 * w / rows.length, row.relative * h))
        ctx.strokeStyle = colors.color; ctx.setLineDash([4, 4]); ctx.beginPath()
        ctx.moveTo(0, (1 - threshold) * h); ctx.lineTo(w, (1 - threshold) * h); ctx.stroke()
        ctx.setLineDash([]); ctx.lineWidth = 2; ctx.beginPath()
        rows.forEach((row, i) => { const x = (row.rank - .5) * w / rows.length, y = (1 - row.cumulative) * h; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
        ctx.stroke()
        ctx.fillStyle = colors.color
        rows.forEach(row => { ctx.beginPath(); ctx.arc((row.rank - .5) * w / rows.length, (1 - row.cumulative) * h, 2.5, 0, Math.PI * 2); ctx.fill() })
      })
    }
  }
})
