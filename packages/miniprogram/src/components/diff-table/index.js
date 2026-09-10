/**
 * DiffTable —— 智能体提出的成批表格改动。
 * 默认全选、未变行不可勾选、按钮文案，全部走共享的 diff 逻辑，
 * 各端不会在「已选几处」这类数字上给出不同答案。
 */
import {
  defaultDiffSelection,
  diffActionLabel,
  summarizeDiff,
  toggleDiffRow
} from '@i-design/common'

const SIGN = { added: '＋', removed: '−', changed: '~', unchanged: '' }

Component({
  options: { addGlobalClass: true },
  properties: {
    title: { type: String, value: '待应用的改动' },
    columns: { type: Array, value: [] },
    rows: { type: Array, value: [] }
  },
  data: { view: [], summary: null, label: '', selected: [] },
  observers: {
    rows: function (rows) {
      // 数据换了就重置选择：沿用旧的勾选会把不存在的行算进去
      this.setData({ selected: defaultDiffSelection(rows) }, () => this.refresh())
    }
  },
  lifetimes: { attached() { this.setData({ selected: defaultDiffSelection(this.data.rows) }, () => this.refresh()) } },
  methods: {
    refresh() {
      const { rows, columns, selected } = this.data
      const summary = summarizeDiff(rows, selected)
      /*
       * 每格的展示值在这里摊平：WXML 取不了 row.cells[column.key] 这种动态键，
       * 符号也只放在首列，避免每格重复。
       */
      this.setData({
        summary,
        label: diffActionLabel(summary),
        view: rows.map((row) => ({
          id: row.id,
          kind: row.kind,
          picked: selected.indexOf(row.id) !== -1,
          changeable: row.kind !== 'unchanged',
          off: row.kind !== 'unchanged' && selected.indexOf(row.id) === -1,
          cells: columns.map((column, index) => ({
            key: column.key,
            sign: index === 0 ? SIGN[row.kind] : '',
            before: (row.cells[column.key] || {}).before || '',
            value: (row.cells[column.key] || {}).value || ''
          }))
        }))
      })
    },
    onToggle(event) {
      const id = event.currentTarget.dataset.id
      this.setData({ selected: toggleDiffRow(this.data.rows, this.data.selected, id) }, () =>
        this.refresh()
      )
    },
    onApply() {
      if (this.data.summary.selected === 0) return
      this.triggerEvent('apply', { ids: this.data.selected })
    }
  }
})
