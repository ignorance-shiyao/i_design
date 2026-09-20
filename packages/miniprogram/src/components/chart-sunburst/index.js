/**
 * 扇段的角度与取色号一律来自 common：Canvas 只把弧度画出来，不重新排序、不重新分配颜色。
 * 一旦在这里自己算一遍，同一份数据在小程序上就会和 Web 端排出不同的顺序。
 */
import { CHART_PALETTE_SIZE, hierarchyView, sunburstSectors } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    model: { type: Object, value: null },
    title: { type: String, value: '旭日图' },
    focusId: { type: String, value: '' },
    selectedId: { type: String, value: '' },
    size: { type: Number, value: 220 }
  },
  data: { rows: [], focusLabel: '' },
  observers: {
    'model, focusId, selectedId, size': function () {
      this.project()
      wx.nextTick(() => this.draw())
    }
  },
  lifetimes: {
    ready() {
      this._themeChange = () => wx.nextTick(() => this.draw())
      if (wx.onThemeChange) wx.onThemeChange(this._themeChange)
      this.project()
      this.draw()
    },
    detached() {
      if (wx.offThemeChange && this._themeChange) wx.offThemeChange(this._themeChange)
    }
  },
  pageLifetimes: { show() { this.draw() }, resize() { this.draw() } },
  methods: {
    select(event) { this.triggerEvent('select', { id: event.currentTarget.dataset.id }) },
    focus(event) { this.triggerEvent('focus', { id: event.currentTarget.dataset.id || '' }) },
    /** 清单里的两个分母都要念出来，WXML 拼不了条件文本，先在这里拼好 */
    project() {
      const model = this.data.model
      if (!model || model.state !== 'ready') { this.setData({ rows: [], focusLabel: '' }); return }
      const view = hierarchyView(model, this.data.focusId || null)
      const focused = this.data.focusId
        ? model.nodes.find(node => node.id === this.data.focusId)
        : null
      this.setData({
        focusLabel: focused ? focused.label : '',
        rows: view.map(node => ({
          id: node.id,
          label: node.label,
          kind: node.kind,
          depth: node.depth,
          valueText: node.valueText,
          shareText: node.shareText,
          sourceIndex: node.sourceIndex,
          description: node.description,
          parentText: node.shareOfParent === null
            ? ''
            : ` · 占上级 ${(node.shareOfParent * 100).toFixed(1)}%`
        }))
      })
    },
    draw() {
      const model = this.data.model
      if (!model || model.state !== 'ready') return
      const query = this.createSelectorQuery()
      query.select('.i-sunburst__plot').fields({ node: true, size: true })
      query.select('.i-sunburst__palette').fields({ computedStyle: ['color', 'background-color', 'border-top-color'] })
      query.selectAll('.i-sunburst__swatch').fields({ computedStyle: ['background-color'] })
      query.exec(result => {
        const item = result[0], base = result[1], swatches = result[2]
        if (!item || !item.node || !base) return
        const canvas = item.node, ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 1
        const size = Math.min(item.width, item.height)
        canvas.width = size * dpr; canvas.height = size * dpr; ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, size, size)
        const sectors = sunburstSectors(hierarchyView(model, this.data.focusId || null), { size })
        const palette = (swatches || []).map(s => s['background-color'])
        for (const sector of sectors) {
          ctx.beginPath()
          ctx.arc(size / 2, size / 2, sector.r1, sector.a0, sector.a1)
          ctx.arc(size / 2, size / 2, sector.r0, sector.a1, sector.a0, true)
          ctx.closePath()
          ctx.fillStyle = sector.kind === 'rest' || sector.colorIndex >= CHART_PALETTE_SIZE
            ? base['border-top-color']
            : palette[sector.colorIndex] || base.color
          ctx.fill()
          ctx.strokeStyle = base['background-color']
          ctx.lineWidth = sector.id === this.data.selectedId ? 2 : 1
          if (sector.id === this.data.selectedId) ctx.strokeStyle = base.color
          ctx.stroke()
        }
        const focused = this.data.focusId
          ? model.nodes.find(node => node.id === this.data.focusId)
          : null
        ctx.fillStyle = base.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(focused ? focused.valueText : model.totalText, size / 2, size / 2)
      })
    }
  }
})
