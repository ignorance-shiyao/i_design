/**
 * InputNumber —— 数字输入。
 * 夹取、取整、步进走公共层，与 Web 端同一套规则。
 */
import { clampNumber, roundTo, stepValue } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: null, value: null },
    min: { type: Number, value: -Infinity },
    max: { type: Number, value: Infinity },
    step: { type: Number, value: 1 },
    precision: { type: Number, value: 0 },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
    invalid: { type: Boolean, value: false },
    placeholder: { type: String, value: '' },
    hideStep: { type: Boolean, value: false }
  },
  data: { focused: false, display: '', canMinus: true, canPlus: true },
  observers: {
    'value, min, max, disabled': function (value, min, max, disabled) {
      this.setData({
        display: value === null || value === undefined ? '' : String(value),
        canMinus: !disabled && (value === null || value > min),
        canPlus: !disabled && (value === null || value < max)
      })
    }
  },
  methods: {
    stepBy(e) {
      const delta = Number(e.currentTarget.dataset.delta)
      const { disabled, value, step, min, max, precision } = this.data
      if (disabled) return
      this.triggerEvent('change', {
        value: stepValue(value ?? 0, delta * step, min, max, precision)
      })
    },
    onInput(e) {
      const text = e.detail.value
      if (text === '') {
        this.triggerEvent('change', { value: null })
        return
      }
      const parsed = Number(text)
      // 中间态（"-"、"1."）不回写，等失焦再规整，否则用户打不出负数
      if (Number.isFinite(parsed)) this.triggerEvent('change', { value: parsed })
    },
    onFocus() { this.setData({ focused: true }) },
    onBlur() {
      this.setData({ focused: false })
      const { value, min, max, precision } = this.data
      if (value !== null && value !== undefined) {
        this.triggerEvent('change', { value: roundTo(clampNumber(value, min, max), precision) })
      }
    }
  }
})
