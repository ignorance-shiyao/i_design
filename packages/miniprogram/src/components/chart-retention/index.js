/**
 * 档位、口径文案与每格的读法都来自 common；这里只把模型摊成 WXML 好渲染的形状。
 * 尤其是「未到期」与「档位」：在这里自己判一次，小程序上的深浅迟早和 Web 端对不上。
 */
import { retentionShade } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    model: { type: Object, value: null },
    title: { type: String, value: '留存' },
    selectedId: { type: String, value: '' }
  },
  data: { rows: [], columns: [], hasPartial: false },
  observers: { 'model': function () { this.project() } },
  lifetimes: { attached() { this.project() } },
  methods: {
    select(event) { this.triggerEvent('select', { id: event.currentTarget.dataset.id }) },
    project() {
      const model = this.data.model
      if (!model || model.state !== 'ready') {
        this.setData({ rows: [], columns: [], hasPartial: false })
        return
      }
      const columns = Array.from({ length: model.periods }, (_, i) => i + 1)
      this.setData({
        columns,
        hasPartial: model.averages.some(average => !average.comparable),
        rows: model.cohorts.map(cohort => ({
          id: cohort.id,
          label: cohort.label,
          sizeText: cohort.sizeText,
          cells: columns.map(period => {
            const cell = cohort.cells.find(item => item.period === period)
            const step = cell ? retentionShade(cell) : null
            return {
              period,
              rateText: cell ? cell.rateText : '—',
              description: cell ? cell.description : '',
              shadeClass: step === null ? 'is-pending' : `is-s${step}`
            }
          })
        }))
      })
    }
  }
})
