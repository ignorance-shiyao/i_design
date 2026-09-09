/**
 * Notification —— 角落通知，可常驻、带操作。
 * 与 toast 的分界：一句话的结果反馈用 toast；需要读完甚至去点一下的用它。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    items: { type: Array, value: [] }
  },
  data: {
    icons: { info: 'info-circle', success: 'check-circle', warning: 'warning-triangle', danger: 'error-circle' }
  },
  methods: {
    onClose(e) {
      this.triggerEvent('close', { id: e.currentTarget.dataset.id })
    },
    onAction(e) {
      const { id, index } = e.currentTarget.dataset
      this.triggerEvent('action', { id, index })
    }
  }
})
