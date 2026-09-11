/**
 * TimeSelect —— 固定间隔的时间下拉。
 * 序列与禁用判定来自公共层，与 Web 端同一份实现。
 */
import { timeSelectOptions } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '' },
    start: { type: String, value: '09:00' },
    end: { type: String, value: '18:00' },
    step: { type: Number, value: 30 },
    minTime: { type: String, value: '' },
    maxTime: { type: String, value: '' },
    placeholder: { type: String, value: '选择时间' },
    disabled: { type: Boolean, value: false },
    invalid: { type: Boolean, value: false }
  },
  data: { open: false, options: [] },
  observers: {
    'start, end, step, minTime, maxTime': function (start, end, step, minTime, maxTime) {
      this.setData({
        options: timeSelectOptions({
          start,
          end,
          step,
          minTime: minTime || undefined,
          maxTime: maxTime || undefined
        })
      })
    }
  },
  methods: {
    onToggle() {
      if (this.data.disabled) return
      this.setData({ open: !this.data.open })
    },
    onPick(e) {
      const option = e.currentTarget.dataset.option
      if (!option || option.disabled) return
      this.setData({ value: option.value, open: false })
      this.triggerEvent('change', { value: option.value })
    }
  }
})
