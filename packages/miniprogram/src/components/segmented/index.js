/**
 * Segmented —— 分段控制器。
 *
 * 滑块位置必须量出选项的真实宽度：小程序没有同步的 offsetWidth，
 * 只能用 createSelectorQuery 异步取。选项变化后重量一次，
 * 否则文字长短一变滑块就与选中项错位。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: null, value: '' },
    options: { type: Array, value: [] },
    size: { type: String, value: 'md' },
    block: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false }
  },
  data: { thumb: { left: 0, width: 0 } },
  observers: {
    'value, options': function () {
      this.measure()
    }
  },
  lifetimes: {
    attached() { this.measure() }
  },
  methods: {
    measure() {
      const index = this.data.options.findIndex((o) => o.value === this.data.value)
      if (index < 0) {
        this.setData({ thumb: { left: 0, width: 0 } })
        return
      }
      this.createSelectorQuery()
        .selectAll('.i-segmented__item')
        .boundingClientRect()
        .select('.i-segmented')
        .boundingClientRect()
        .exec((res) => {
          const items = res[0]
          const box = res[1]
          if (!items || !items[index] || !box) return
          this.setData({
            thumb: { left: items[index].left - box.left - 2, width: items[index].width }
          })
        })
    },
    onPick(e) {
      const { value, disabled } = e.currentTarget.dataset
      if (this.data.disabled || disabled || value === this.data.value) return
      this.triggerEvent('change', { value })
    }
  }
})
