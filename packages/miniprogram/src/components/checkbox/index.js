Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: Array, value: [] },
    options: { type: Array, value: [] },
    max: { type: Number, value: 0 },
    direction: { type: String, value: 'horizontal' },
    disabled: { type: Boolean, value: false }
  },
  data: { states: [] },
  observers: {
    'value, options, max, disabled': function (value, options, max, disabled) {
      const atMax = max > 0 && value.length >= max
      this.setData({
        states: options.map((o) => {
          const checked = value.includes(o.value)
          return {
            ...o,
            checked,
            // 达上限后未选中项禁用，已选中的仍可取消——不让用户陷入死角
            disabled: disabled || o.disabled || (atMax && !checked)
          }
        })
      })
    }
  },
  methods: {
    onToggle(e) {
      const { value, disabled } = e.currentTarget.dataset
      if (disabled) return
      const current = this.data.value
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      this.triggerEvent('change', { value: next })
    }
  }
})
