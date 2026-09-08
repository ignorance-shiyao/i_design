/**
 * ChatToolCall —— 一次工具调用。
 *
 * 入参与结果在小程序里必须先在 JS 里格式化成字符串：
 * WXML 不能调用 JSON.stringify，直接绑对象只会渲染成 [object Object]。
 */
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
  data: { open: false, argsText: '', resultText: '' },
  lifetimes: {
    // 失败的调用默认展开：这时用户要看的正是出了什么错
    attached() {
      this.setData({ open: this.data.defaultOpen || this.data.status === 'error' })
    }
  },
  observers: {
    'args, result': function (args, result) {
      this.setData({ argsText: this.format(args), resultText: this.format(result) })
    }
  },
  methods: {
    format(value) {
      if (value === undefined || value === null) return ''
      if (typeof value === 'string') return value
      return JSON.stringify(value, null, 2)
    },
    onToggle() { this.setData({ open: !this.data.open }) }
  }
})
