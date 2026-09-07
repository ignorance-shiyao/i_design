/**
 * DatePicker —— 日历格子、周次标签与格式化全部来自公共层。
 *
 * 不用小程序内置的 <picker mode="date">：那是系统滚轮，与 Web 端的月历面板
 * 在信息量和操作路径上都不是一回事，同一个产品的两端会明显割裂。
 */
import {
  addMonths,
  buildCalendar,
  formatDate,
  parseISO,
  startOfMonth,
  toISO,
  weekdayLabels
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: '请选择日期' },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
    clearable: { type: Boolean, value: false },
    min: { type: String, value: '' },
    max: { type: String, value: '' },
    format: { type: String, value: 'YYYY-MM-DD' },
    weekStart: { type: Number, value: 1 }
  },
  data: { open: false, display: '', title: '', weekdays: [], cells: [], viewISO: '' },
  lifetimes: {
    attached() { this.refresh() }
  },
  observers: {
    'value, format, weekStart, min, max': function () { this.refresh() }
  },
  methods: {
    /** 面板当前展示的月份；未选中时落在今天所在月 */
    viewDate() {
      const parsed = parseISO(this.data.viewISO)
      if (parsed) return parsed
      return startOfMonth(parseISO(this.data.value) || new Date())
    },

    isDisabled(iso) {
      const { min, max } = this.data
      if (min && iso < min) return true
      if (max && iso > max) return true
      return false
    },

    refresh(viewDate) {
      const view = viewDate || this.viewDate()
      const selected = parseISO(this.data.value)
      const selectedISO = selected ? toISO(selected) : ''

      this.setData({
        viewISO: toISO(view),
        display: selected ? formatDate(selected, this.data.format) : '',
        title: `${view.getFullYear()} 年 ${view.getMonth() + 1} 月`,
        weekdays: weekdayLabels(this.data.weekStart),
        // 把日期对象摊平成 setData 能传的纯数据：WXML 拿不到 Date 实例
        cells: buildCalendar(view, this.data.weekStart).map((cell) => ({
          iso: cell.iso,
          day: cell.day,
          outside: cell.outside,
          today: cell.today,
          selected: cell.iso === selectedISO,
          disabled: this.isDisabled(cell.iso)
        }))
      })
    },

    onToggle() {
      if (this.data.disabled) return
      if (!this.data.open) this.refresh(startOfMonth(parseISO(this.data.value) || new Date()))
      this.setData({ open: !this.data.open })
    },

    onShiftMonth(e) {
      this.refresh(addMonths(this.viewDate(), Number(e.currentTarget.dataset.delta)))
    },

    onPick(e) {
      const { iso, disabled } = e.currentTarget.dataset
      if (disabled) return
      this.setData({ open: false })
      this.triggerEvent('change', { value: iso })
    },

    onToday() {
      const today = new Date()
      const iso = toISO(today)
      this.refresh(startOfMonth(today))
      if (!this.isDisabled(iso)) {
        this.setData({ open: false })
        this.triggerEvent('change', { value: iso })
      }
    },

    onClear() {
      this.setData({ open: false })
      this.triggerEvent('change', { value: '' })
    }
  }
})
