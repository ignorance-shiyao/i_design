Component({
  options: { addGlobalClass: true, virtualHost: true },
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: '' },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
    invalid: { type: Boolean, value: false },
    type: { type: String, value: 'text' }
  },
  methods: {
    onInput(e) {
      // 事件名沿用小程序惯例 change，同时透出 value 便于父级双向绑定
      this.triggerEvent('change', { value: e.detail.value })
    },
    onBlur(e) {
      this.triggerEvent('blur', { value: e.detail.value })
    }
  }
})
