/**
 * ChatToolCall —— 一次工具调用。
 *
 * 入参与结果在小程序里必须先在 JS 里格式化成字符串：
 * WXML 不能调用 JSON.stringify，直接绑对象只会渲染成 [object Object]。
 */
import { getLocale } from '../../config'

Component({
  options: { addGlobalClass: true },
  properties: {
    name: { type: String, value: '' },
    summary: { type: String, value: '' },
    status: { type: String, value: 'success' },
    args: { type: null, value: null },
    result: { type: null, value: null },
    error: { type: String, value: '' },
    defaultOpen: { type: Boolean, value: false }
  },
  data: { open: false, argsText: '', resultText: '', inputLabel: '', errorLabel: '', resultLabel: '' },
  lifetimes: {
    // 失败的调用默认展开：这时用户要看的正是出了什么错
    attached() {
      this.syncLocale()
      this.setData({ open: this.data.defaultOpen || this.data.status === 'error' })
    }
  },
  observers: {
    'args, result': function (args, result) {
      this.setData({ argsText: this.format(args), resultText: this.format(result) })
    }
  },
  methods: {
    /* 入参 / 错误 / 结果这三个词也要跟着字典走 */
    syncLocale() {
      const locale = getLocale()
      this.setData({
        inputLabel: locale.toolInput,
        errorLabel: locale.toolError,
        resultLabel: locale.toolResult,
      })
    },
    format(value) {
      if (value === undefined || value === null) return ''
      if (typeof value === 'string') return value
      return JSON.stringify(value, null, 2)
    },
    onToggle() { this.setData({ open: !this.data.open }) }
  }
})
