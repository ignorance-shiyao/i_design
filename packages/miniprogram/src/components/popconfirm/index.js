/**
 * Popconfirm —— 就地确认一次轻量的、可能有后果的操作。
 *
 * 与 modal 的分工同 Web 端：删一行用 popconfirm，删整个项目用 modal。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    content: { type: String, value: '' },
    confirmText: { type: String, value: '确定' },
    cancelText: { type: String, value: '取消' },
    placement: { type: String, value: 'top' },
    theme: { type: String, value: 'default' },
    disabled: { type: Boolean, value: false }
  },
  data: { visible: false },
  methods: {
    onToggle() {
      if (this.data.disabled) return
      this.setData({ visible: !this.data.visible })
    },
    onConfirm() {
      this.setData({ visible: false })
      this.triggerEvent('confirm')
    },
    onCancel() {
      this.setData({ visible: false })
      this.triggerEvent('cancel')
    }
  }
})
