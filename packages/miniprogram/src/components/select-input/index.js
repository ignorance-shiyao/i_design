import { getLocale } from '../../config'

/**
 * SelectInput —— 选择器外壳。
 *
 * 面板开合由调用方持有：它才知道选完要不要关。
 * 小程序没有 combobox 语义，读屏靠 aria-role 由页面自行补。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: '' },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
    invalid: { type: Boolean, value: false },
    clearable: { type: Boolean, value: false },
    /** 允许在框内输入，用于可搜索的选择器 */
    filterable: { type: Boolean, value: false },
    keyword: { type: String, value: '' },
    open: { type: Boolean, value: false }
  },
  data: {
    placeholderText: ''
  },
  lifetimes: {
    attached() {
      this.syncLocale()
    }
  },
  methods: {
    /* 传了就用传的，没传才回落到字典 */
    syncLocale() {
      const locale = getLocale()
      this.setData({
        placeholderText: this.data.placeholder || locale.placeholder
      })
    },
    onTap() {
      if (this.data.disabled) return
      this.triggerEvent('openchange', { open: !this.data.open })
    },
    onInput(e) {
      this.triggerEvent('keywordchange', { keyword: e.detail.value })
    },
    /** 输入框自己的点击不冒泡到外壳，否则每敲一下都在开合面板 */
    noop() {},
    onClear(e) {
      // 清除不该顺带把面板打开：它们是两件事
      if (e && e.stopPropagation) e.stopPropagation()
      this.triggerEvent('keywordchange', { keyword: '' })
      this.triggerEvent('clear')
    }
  }
})
