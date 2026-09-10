/**
 * TimePicker —— 时间选择。
 *
 * 不用小程序内置的 <picker mode="time">：它给不出步长与可选范围，
 * 同一个表单在 Web 上只能选整刻、在小程序上能选到分钟，规则就分叉了。
 * 取值判定全部走公共层。
 */
import { ZERO, clampTime, formatTime, isUnitEnabled, parseTime, timeColumn } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** HH:mm 或 HH:mm:ss；空串表示未选 */
    value: { type: String, value: '' },
    placeholder: { type: String, value: '选择时间' },
    showSecond: { type: Boolean, value: true },
    hourStep: { type: Number, value: 1 },
    minuteStep: { type: Number, value: 1 },
    secondStep: { type: Number, value: 1 },
    /** 可选范围，含端点 */
    min: { type: String, value: '' },
    max: { type: String, value: '' },
    disabled: { type: Boolean, value: false },
    clearable: { type: Boolean, value: true }
  },
  data: { open: false, columns: [] },
  observers: {
    'value, min, max, showSecond, hourStep, minuteStep, secondStep': function () {
      this.rebuild()
    }
  },
  lifetimes: { attached() { this.rebuild() } },
  methods: {
    bounds() {
      return {
        min: this.data.min ? parseTime(this.data.min) || undefined : undefined,
        max: this.data.max ? parseTime(this.data.max) || undefined : undefined
      }
    },

    /** 未选时落在范围起点，而不是 00:00——那可能根本不可选 */
    draft() {
      const parsed = this.data.value ? parseTime(this.data.value) : null
      return parsed || this.bounds().min || ZERO
    },

    stepOf(unit) {
      if (unit === 'hour') return this.data.hourStep
      if (unit === 'minute') return this.data.minuteStep
      return this.data.secondStep
    },

    rebuild() {
      const units = this.data.showSecond ? ['hour', 'minute', 'second'] : ['hour', 'minute']
      const current = this.draft()
      const bounds = this.bounds()
      this.setData({
        columns: units.map((unit) => {
          const cells = timeColumn(unit, this.stepOf(unit)).map((value) => ({
            value,
            id: unit + '-' + value,
            text: String(value).padStart(2, '0'),
            active: current[unit] === value,
            disabled: !isUnitEnabled(unit, value, current, bounds)
          }))
          const hit = cells.filter((c) => c.active)[0]
          return {
            unit,
            cells,
            // 打开时把当前值滚进视野：不滚的话选 23:45 打开看到的是 00 开头那一列，
            // 用户会以为值丢了，而它在下面五百像素处
            activeId: hit ? hit.id : ''
          }
        })
      })
    },

    toggle() {
      if (this.data.disabled) return
      this.setData({ open: !this.data.open })
    },

    close() { this.setData({ open: false }) },

    clear() {
      this.setData({ value: '', open: false })
      this.triggerEvent('change', { value: '' })
    },

    commit(next) {
      const clamped = clampTime(next, {
        min: this.bounds().min,
        max: this.bounds().max,
        showSecond: this.data.showSecond,
        step: {
          hour: this.data.hourStep,
          minute: this.data.minuteStep,
          second: this.data.secondStep
        }
      })
      const text = formatTime(clamped, this.data.showSecond)
      this.setData({ value: text })
      this.triggerEvent('change', { value: text })
    },

    onPick(e) {
      const unit = e.currentTarget.dataset.unit
      const value = Number(e.currentTarget.dataset.value)
      const current = this.draft()
      if (!isUnitEnabled(unit, value, current, this.bounds())) return
      const next = { hour: current.hour, minute: current.minute, second: current.second }
      next[unit] = value
      this.commit(next)
    },

    onNow() {
      const d = new Date()
      this.commit({ hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() })
    }
  }
})
