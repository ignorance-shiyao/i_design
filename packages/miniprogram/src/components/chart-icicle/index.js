/**
 * 每一格的位置与取色号一律来自 common：Canvas 只把矩形画出来。
 * 在这里自己按比例算一遍，同一份数据在小程序上就会和 Web 端排出不同的顺序。
 */
import { CHART_PALETTE_SIZE, hierarchyView, icicleCells, icicleHeight } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    model: { type: Object, value: null },
    title: { type: String, value: 'Icicle 图' },
    focusId: { type: String, value: '' },
    selectedId: { type: String, value: '' },
    rowHeight: { type: Number, value: 28 }
  },
  data: { rows: [], focusLabel: '', canvasHeight: 0 },
  observers: {
    'model, focusId, selectedId, rowHeight': function () {
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
      if (!model || model.state !== 'ready') {
        this.setData({ rows: [], focusLabel: '', canvasHeight: 0 })
        return
      }
      const view = hierarchyView(model, this.data.focusId || null)
      const focused = this.data.focusId
        ? model.nodes.find(node => node.id === this.data.focusId)
        : null
      this.setData({
        focusLabel: focused ? `${focused.label}（${focused.valueText}）` : '',
        canvasHeight: icicleHeight(view, { rowHeight: this.data.rowHeight }),
        rows: view.map(node => ({
          id: node.id,
          label: node.label,
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
      query.select('.i-icicle__plot').fields({ node: true, size: true })
      query.select('.i-icicle__palette').fields({ computedStyle: ['color', 'background-color', 'border-top-color'] })
      query.selectAll('.i-icicle__swatch').fields({ computedStyle: ['background-color'] })
      query.exec(result => {
        const item = result[0], base = result[1], swatches = result[2]
        if (!item || !item.node || !base) return
        const canvas = item.node, ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 1
        canvas.width = item.width * dpr; canvas.height = item.height * dpr; ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, item.width, item.height)
        const view = hierarchyView(model, this.data.focusId || null)
        const cells = icicleCells(view, { width: item.width, rowHeight: this.data.rowHeight })
        const palette = (swatches || []).map(s => s['background-color'])
        for (const cell of cells) {
          ctx.fillStyle = cell.kind === 'rest' || cell.colorIndex >= CHART_PALETTE_SIZE
            ? base['border-top-color']
            : palette[cell.colorIndex] || base.color
          ctx.fillRect(cell.x, cell.y, cell.width, cell.height)
          ctx.strokeStyle = cell.id === this.data.selectedId ? base.color : base['background-color']
          ctx.lineWidth = cell.id === this.data.selectedId ? 2 : 1
          ctx.strokeRect(cell.x, cell.y, cell.width, cell.height)
          /*
           * 格子里不写标签：Canvas 上的字要自己按底色挑字色，而八个分类色
           * 深浅不一，一律白字有四个读不出来。名字交给下面的清单，那里字色是
           * 正文色，读屏器也念得到。
           */
        }
      })
    }
  }
})
