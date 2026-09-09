/**
 * Radio —— 小程序把「组 + 项」合成一个组件。
 * Web 端靠 provide/inject 让子项拿到组的状态，小程序没有等价机制，
 * 用 options 数组反而更直接，也避免了跨组件通信的 setData 开销。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: null, value: '' },
    options: { type: Array, value: [] },
    variant: { type: String, value: 'default' },
    direction: { type: String, value: 'horizontal' },
    disabled: { type: Boolean, value: false }
  },
  methods: {
    onPick(e) {
      const { value, disabled } = e.currentTarget.dataset
      if (disabled || this.data.disabled || value === this.data.value) return
      this.triggerEvent('change', { value })
    }
  }
})
