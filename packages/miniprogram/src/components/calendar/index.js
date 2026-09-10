/**
 * Calendar —— 日历。
 *
 * 格子由公共层的 buildCalendar 生成（固定 6 行，切月时高度不跳），
 * 范围选择走 selectRange——「点第二下是结束日期还是重新开始选」
 * 两种都说得通，因此必须只写一份。
 */
import {
  addMonths,
  buildCalendar,
  groupMarks,
  isInRange,
  isRangeEdge,
  parseISO,
  selectRange,
  toISO,
  weekdayLabels
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** 单选传 ISO 字符串；范围选传 { start, end } */
    value: { type: null, value: '' },
    mode: { type: String, value: 'single' },
    /** 日程标记 */
    marks: { type: Array, value: [] },
    weekStart: { type: Number, value: 1 },
    min: { type: String, value: '' },
    max: { type: String, value: '' }
  },
  data: { cells: [], labels: [], title: '' },
  observers: {
    'value, marks, weekStart, min, max': function () { this.rebuild() }
  },
  lifetimes: {
    attached() {
      const start = typeof this.data.value === 'string' ? this.data.value : (this.data.value || {}).start
      this.view = parseISO(start) || new Date()
      this.rebuild()
    }
  },
  methods: {
    range() {
      const v = this.data.value
      return typeof v === 'string' ? { start: v || null, end: null } : (v || { start: null, end: null })
    },

    disabled(iso) {
      return !!((this.data.min && iso < this.data.min) || (this.data.max && iso > this.data.max))
    },

    rebuild() {
      if (!this.view) return
      const range = this.range()
      const grouped = groupMarks(this.data.marks)
      const cells = buildCalendar(this.view, this.data.weekStart).map((cell) => {
        const list = grouped.get(cell.iso) || []
        const edge = isRangeEdge(cell.iso, range)
        const cls = [
          cell.outside ? 'is-outside' : '',
          cell.today ? 'is-today' : '',
          this.disabled(cell.iso) ? 'is-disabled' : '',
          edge ? 'is-selected' : '',
          this.data.mode === 'range' && isInRange(cell.iso, range) ? 'is-in-range' : '',
          edge === 'start' ? 'is-start' : '',
          edge === 'end' ? 'is-end' : ''
        ].filter(Boolean).join(' ')
        return {
          iso: cell.iso,
          day: cell.day,
          cls,
          marks: list.slice(0, 2),
          more: list.length > 2 ? list.length - 2 : 0
        }
      })
      this.setData({
        cells,
        labels: weekdayLabels(this.data.weekStart),
        title: this.view.getFullYear() + ' 年 ' + (this.view.getMonth() + 1) + ' 月'
      })
    },

    shift(e) {
      this.view = addMonths(this.view, Number(e.currentTarget.dataset.delta))
      this.rebuild()
    },

    onPick(e) {
      const iso = e.currentTarget.dataset.iso
      if (this.disabled(iso)) return
      const next = this.data.mode === 'range' ? selectRange(this.range(), iso) : iso
      this.setData({ value: next })
      this.rebuild()
      this.triggerEvent('change', { value: next })
      this.triggerEvent('select', { value: iso })
    }
  }
})
