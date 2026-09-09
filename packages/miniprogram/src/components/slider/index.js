/**
 * Slider —— 在连续区间里取值。
 *
 * 小程序没有 pointer 事件，用 touch 事件配合一次布局查询实现拖动：
 * 轨道位置在开始拖动时量一次即可，拖动过程中再查会明显卡顿。
 */
import { ratioOf, valueFromRatio } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: Number, value: 0 },
    min: { type: Number, value: 0 },
    max: { type: Number, value: 100 },
    step: { type: Number, value: 1 },
    precision: { type: Number, value: 0 },
    disabled: { type: Boolean, value: false },
    marks: { type: Array, value: [] }
  },
  data: { percent: 0, markViews: [] },
  observers: {
    'value, min, max, marks': function (value, min, max, marks) {
      this.setData({
        percent: ratioOf(value, min, max) * 100,
        markViews: marks.map((m) => ({
          ...m,
          left: ratioOf(m.value, min, max) * 100,
          passed: m.value <= value
        }))
      })
    }
  },
  methods: {
    measure() {
      return new Promise((resolve) => {
        this.createSelectorQuery()
          .select('.i-slider__track')
          .boundingClientRect(resolve)
          .exec()
      })
    },
    async onTouchStart(e) {
      if (this.data.disabled) return
      this.rect = await this.measure()
      this.apply(e)
    },
    onTouchMove(e) {
      if (this.data.disabled || !this.rect) return
      this.apply(e)
    },
    apply(e) {
      const rect = this.rect
      if (!rect || !rect.width) return
      const x = e.touches[0].clientX
      const { min, max, step, precision } = this.data
      const next = valueFromRatio((x - rect.left) / rect.width, min, max, step, precision)
      if (next !== this.data.value) this.triggerEvent('change', { value: next })
    }
  }
})
