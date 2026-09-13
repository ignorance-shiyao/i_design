/**
 * TimeSelect —— 固定间隔的时间下拉。
 * 序列与禁用判定来自公共层，与 Web 端同一份实现。
 */
import { timeSelectOptions, shouldFlipUp } from '@i-design/common'

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
  data: { open: false, flipUp: false, options: [] },
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

    /*
     * 面板往上还是往下开。它贴着触发器排布，触发器一靠近屏幕底缘，
     * 整块面板就掉出可视区——内容还在，但够不着。
     * 判断走公共层；这一端量位置只能异步查询，因此开的时候量一次就定下来。
     */
    place() {
      const query = this.createSelectorQuery()
      query.select('.i-time-select').boundingClientRect()
      query.select('.i-time-select__panel').boundingClientRect()
      query.selectViewport().boundingClientRect()
      query.exec((res) => {
        const [trigger, panel, viewport] = res || []
        if (!trigger || !panel || !viewport) return
        this.setData({
          flipUp: shouldFlipUp(
            { y: trigger.top, height: trigger.height },
            panel.height,
            viewport.height
          )
        })
      })
    },

    onToggle() {
      if (this.data.disabled) return
      const open = !this.data.open
      this.setData({ open, flipUp: open ? this.data.flipUp : false })
      if (open) this.place()
    },
    onPick(e) {
      const option = e.currentTarget.dataset.option
      if (!option || option.disabled) return
      this.setData({ value: option.value, open: false })
      this.triggerEvent('change', { value: option.value })
    }
  }
})
