/**
 * Tooltip —— 小程序没有 hover，改为点击触发并再次点击关闭。
 *
 * 这也是移动端的通行做法：把「悬停才看得到的说明」放到触屏上，
 * 用户根本没有触发它的手势。
 *
 * 位置由共享的 resolveOverlay 算出：贴近屏幕边缘时自动翻转与推回，
 * 与 Web 端同一套判断。
 */
import { resolveOverlay } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    content: { type: String, value: '' },
    placement: { type: String, value: 'top' },
    disabled: { type: Boolean, value: false }
  },
  data: { visible: false, left: 0, top: 0, arrow: 0, actual: 'top' },
  methods: {
    onToggle() {
      if (this.data.disabled || !this.data.content) return
      if (this.data.visible) return this.hide()
      this.setData({ visible: true }, () => this.place())
    },
    hide() {
      this.setData({ visible: false })
    },
    place() {
      const query = this.createSelectorQuery()
      query.select('.i-tooltip__trigger').boundingClientRect()
      query.select('.i-tooltip__pop').boundingClientRect()
      query.selectViewport().boundingClientRect()
      query.exec((res) => {
        const [trigger, popup, viewport] = res
        if (!trigger || !popup || !viewport) return
        const pos = resolveOverlay({
          trigger,
          popup,
          viewport: { x: 0, y: 0, width: viewport.width, height: viewport.height },
          placement: this.data.placement,
          offset: 6
        })
        // 箭头减 5：它是 5px 边框拼出的三角，要以中心对准触发元素中心
        this.setData({ left: pos.x, top: pos.y, arrow: pos.arrow - 5, actual: pos.placement })
      })
    }
  }
})
