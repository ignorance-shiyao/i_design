/**
 * FineTuneCard —— 属性检查器。
 *
 * 智能体生成之后，人接着微调。与一张普通表单差在一件事上：随时看得出
 * 「哪几项被我改过」，并且能单独退回去——没有这条，用户调了七八下之后
 * 就不敢再动了，他不知道自己已经偏离原始结果多远。
 *
 * 改动判定、夹范围、吸步长、显示文字都走公共层：同一个属性在这一端
 * 拖出 12、在 Web 上敲出 12.7 的话，两端保存下来的就不是同一份配置。
 *
 * WXML 不能调用函数，每一行要显示什么都在 JS 里算好。
 */
import {
  changedKeys,
  clampFieldValue,
  fieldRatio,
  fineTuneSummary,
  formatFieldValue,
  resetField
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    fields: { type: Array, value: [] },
    /** 智能体给出的原始值。退回时回到这里 */
    original: { type: Object, value: {} },
    values: { type: Object, value: {} },
    title: { type: String, value: '微调' }
  },
  data: { rows: [], summary: '', anyChanged: false },
  lifetimes: {
    attached() {
      this.build()
    }
  },
  observers: {
    'fields, original, values': function () {
      this.build()
    }
  },
  methods: {
    build() {
      const { fields, original, values } = this.data
      const changed = changedKeys(fields, original, values)
      const changedSet = {}
      changed.forEach((k) => (changedSet[k] = true))
      this.setData({
        summary: fineTuneSummary(changed.length),
        anyChanged: changed.length > 0,
        rows: fields.map((field) => ({
          field,
          changed: !!changedSet[field.key],
          value: values[field.key],
          // 退回按钮上写的是「退回到什么」，而不是一个光秃秃的箭头
          originalText: formatFieldValue(field, original[field.key]),
          valueText: formatFieldValue(field, values[field.key]),
          percent: Math.round(fieldRatio(field, values[field.key]) * 100)
        }))
      })
    },

    fieldAt(e) {
      return this.data.fields[Number(e.currentTarget.dataset.index)]
    },

    emit(values) {
      this.triggerEvent('valueschange', { values })
    },

    onNumber(e) {
      const field = this.fieldAt(e)
      if (!field) return
      // 夹范围与吸步长在逻辑层做：拖的和敲的必须得到同一个值
      this.emit({ ...this.data.values, [field.key]: clampFieldValue(field, e.detail.value) })
    },

    onSwitch(e) {
      const field = this.fieldAt(e)
      if (!field) return
      this.emit({ ...this.data.values, [field.key]: !!e.detail.value })
    },

    onSelect(e) {
      const field = this.fieldAt(e)
      if (!field) return
      this.emit({ ...this.data.values, [field.key]: e.detail.value })
    },

    onText(e) {
      const field = this.fieldAt(e)
      if (!field) return
      this.emit({ ...this.data.values, [field.key]: e.detail.value })
    },

    revert(e) {
      const field = this.fieldAt(e)
      if (!field) return
      this.emit(resetField(this.data.original, this.data.values, field.key))
    },

    resetAll() {
      if (!this.data.anyChanged) return
      this.triggerEvent('reset')
    }
  }
})
