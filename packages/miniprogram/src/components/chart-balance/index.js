/**
 * 台阶的起止、增减方向与读法都来自 common 的模型；这里只把数值坐标换算成百分比。
 * WXML 算不了表达式里的除法，所以先在这儿摊平。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    model: { type: Object, value: null },
    title: { type: String, value: '贡献' },
    selectedId: { type: String, value: '' },
    rowHeight: { type: Number, value: 32 }
  },
  data: { rows: [], zero: 0 },
  observers: { 'model': function () { this.project() } },
  lifetimes: { attached() { this.project() } },
  methods: {
    select(event) { this.triggerEvent('select', { id: event.currentTarget.dataset.id }) },
    project() {
      const model = this.data.model
      if (!model || model.state !== 'ready') { this.setData({ rows: [], zero: 0 }); return }
      const span = model.max - model.min || 1
      const pos = value => ((value - model.min) / span) * 100
      this.setData({
        zero: pos(0),
        rows: model.steps.map(step => {
          const a = pos(Math.min(step.from, step.to))
          const b = pos(Math.max(step.from, step.to))
          return {
            id: step.id,
            label: step.label,
            kind: step.kind,
            direction: step.direction,
            valueText: step.valueText,
            cumulativeText: step.cumulativeText,
            description: step.description,
            left: a,
            width: Math.max(b - a, 0.6)
          }
        })
      })
    }
  }
})
