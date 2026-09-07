/**
 * Tooltip —— 小程序没有 hover，改为点击触发并再次点击关闭。
 *
 * 这也是移动端的通行做法：把「悬停才看得到的说明」放到触屏上，
 * 用户根本没有触发它的手势。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    content: { type: String, value: '' },
    placement: { type: String, value: 'top' },
    disabled: { type: Boolean, value: false }
  },
  data: { visible: false },
  methods: {
    onToggle() {
      if (this.data.disabled || !this.data.content) return
      this.setData({ visible: !this.data.visible })
    },
    hide() { this.setData({ visible: false }) }
  }
})
