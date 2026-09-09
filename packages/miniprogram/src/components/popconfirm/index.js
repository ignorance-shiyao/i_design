/**
 * Popconfirm —— 就地确认一次轻量的、可能有后果的操作。
 *
 * 位置由共享的 resolveOverlay 算出：贴近屏幕边缘时自动翻转与推回，
 * 与 Web 端同一套判断。
 *
 * 与 modal 的分工同 Web 端：删一行用 popconfirm，删整个项目用 modal。
 */
import { resolveOverlay } from '@i-design/common'

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
  data: { visible: false, left: 0, top: 0, arrow: 0, actual: 'top' },
  methods: {
    onToggle() {
      if (this.data.disabled) return
      if (this.data.visible) return this.setData({ visible: false })
      this.setData({ visible: true }, () => this.place())
    },

    place() {
      const query = this.createSelectorQuery()
      query.select('.i-popconfirm__trigger').boundingClientRect()
      query.select('.i-popconfirm__panel').boundingClientRect()
      query.selectViewport().boundingClientRect()
      query.exec((res) => {
        const [trigger, popup, viewport] = res
        if (!trigger || !popup || !viewport) return
        const pos = resolveOverlay({
          trigger,
          popup,
          viewport: { x: 0, y: 0, width: viewport.width, height: viewport.height },
          placement: this.data.placement
        })
        // 箭头减 4：它是 8px 见方的方块，要以中心对准触发元素中心
        this.setData({ left: pos.x, top: pos.y, arrow: pos.arrow - 4, actual: pos.placement })
      })
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
