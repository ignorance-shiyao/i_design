Component({
  options: { addGlobalClass: true },
  properties: {
    text: { type: String, value: '' },
    theme: { type: String, value: 'brand' },
    size: { type: String, value: 'md' },
    /** 下划线时机：always / hover / never。小程序没有 hover 态，hover 档按 never 渲染 */
    underline: { type: String, value: 'always' },
    disabled: { type: Boolean, value: false },
    /** 小程序不能直接开新标签页，外链由业务自行决定跳转方式 */
    url: { type: String, value: '' }
  },
  methods: {
    onTap(event) {
      if (this.data.disabled) return
      this.triggerEvent('click', event.detail)
    }
  }
})
