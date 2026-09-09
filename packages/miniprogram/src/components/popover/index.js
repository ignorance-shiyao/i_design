/**
 * Popover —— 气泡卡片，承载比文字提示更复杂的内容。
 *
 * 与 tooltip 的分界同 Web 端：一句话说明用 tooltip，
 * 需要标题、段落或可交互内容时用 popover。
 */
import { resolveOverlay } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    content: { type: String, value: '' },
    placement: { type: String, value: 'top' },
    disabled: { type: Boolean, value: false }
  },
  data: { visible: false, left: 0, top: 0, arrow: 0, actual: 'top' },
  methods: {
    onToggle() {
      if (this.data.disabled) return
      if (this.data.visible) return this.close()
      this.setData({ visible: true }, () => this.place())
    },

    close() {
      this.setData({ visible: false })
    },

    place() {
      const query = this.createSelectorQuery()
      query.select('.i-overlay-trigger').boundingClientRect()
      query.select('.i-popover').boundingClientRect()
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
    }
  }
})
