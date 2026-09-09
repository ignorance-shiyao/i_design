/**
 * Button —— 小程序实现。
 * 属性名与 Web 端保持一致，样式直接引用编译后的共享 WXSS，
 * 因此同一个按钮在小程序里与 Web 端逐像素相同。
 */
Component({
  options: {
    // 允许外部传入的全局类名生效，否则组件样式隔离会挡掉共享 CSS
    addGlobalClass: true,
    multipleSlots: true
  },
  properties: {
    variant: { type: String, value: 'secondary' },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
    loading: { type: Boolean, value: false },
    block: { type: Boolean, value: false }
  },
  methods: {
    onTap(event) {
      if (this.data.disabled || this.data.loading) return
      this.triggerEvent('click', event.detail)
    }
  }
})
