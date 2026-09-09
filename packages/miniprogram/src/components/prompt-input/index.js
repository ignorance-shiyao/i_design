/**
 * PromptInput —— 会话输入台。
 *
 * 小程序的 <textarea> 是原生组件：它自带 auto-height，因此不需要 Web 端那套
 * 量 scrollHeight 的做法；但它也会盖在其他元素之上，所以发送按钮与它同级平铺，
 * 而不是浮在输入框内部。
 */
import { fileTypeOf, formatSize } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: '问点什么…' },
    disabled: { type: Boolean, value: false },
    generating: { type: Boolean, value: false },
    maxLength: { type: Number, value: 0 },
    attachments: { type: Array, value: [] },
    hint: { type: String, value: '' }
  },
  data: { focused: false, length: 0, over: false, canSend: false, files: [] },
  observers: {
    'value, maxLength, disabled': function (value, maxLength, disabled) {
      const length = (value || '').length
      const over = maxLength > 0 && length > maxLength
      this.setData({
        length,
        over,
        canSend: !disabled && !over && (value || '').trim().length > 0
      })
    },
    attachments: function (files) {
      this.setData({
        // 类型图标与配色在这里算好：WXML 里调不了函数
        files: files.map((f) => {
          const type = fileTypeOf(f.name || '')
          return {
            ...f,
            sizeText: f.size ? formatSize(f.size) : '',
            typeIcon: type.icon,
            typeLabel: type.label,
            typeSlot: type.slot || 1
          }
        })
      })
    }
  },
  methods: {
    onInput(e) { this.triggerEvent('change', { value: e.detail.value }) },
    onFocus() { this.setData({ focused: true }) },
    onBlur() { this.setData({ focused: false }) },
    onSubmit() {
      if (!this.data.canSend) return
      this.triggerEvent('submit', { value: this.data.value })
    },
    onStop() { this.triggerEvent('stop') },
    onAttach() { this.triggerEvent('attach') },
    onRemove(e) { this.triggerEvent('removeattachment', { index: e.currentTarget.dataset.index }) }
  }
})
