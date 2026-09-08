/**
 * Progress —— 线形进度。
 *
 * 只做线形：环形要画 SVG，而小程序的 WXML 没有 svg 标签，
 * 用 canvas 画一个静态圆环，代价与收益不成比例。需要环形时用 canvas 自绘。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    percent: { type: Number, value: 0 },
    status: { type: String, value: 'normal' },
    size: { type: String, value: 'md' },
    indeterminate: { type: Boolean, value: false },
    showText: { type: Boolean, value: true },
    text: { type: String, value: '' }
  },
  data: { clamped: 0, label: '0%' },
  observers: {
    'percent, text': function (percent, text) {
      const clamped = Math.min(100, Math.max(0, percent))
      this.setData({ clamped, label: text || `${Math.round(clamped)}%` })
    }
  }
})
