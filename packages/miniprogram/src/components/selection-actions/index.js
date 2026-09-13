/**
 * SelectionActions —— 选区操作。
 *
 * 选中一段文字，就地把它交给智能体。
 *
 * **与 Web 端的差别在于「怎么选」，不在于「选中之后怎么办」。**
 * 小程序的 `user-select` 只让文字能被系统复制，没有任何接口能读回用户
 * 划到了哪几个字。所以这一端按段落选：长按一段就把整段交给动作条，
 * 调用方把段落文字与它的位置传进来。
 *
 * 选区的清理、字数上限、引文省略、动作条摆哪边，全部与 Web 端共用同一份逻辑——
 * 「超过 2000 字不给动作」这条各端各写一遍的话，同一段话在一端能改、在另一端不能。
 */
import {
  cleanSelection,
  hasSelection,
  selectionAnchor,
  selectionCount,
  selectionExcerpt,
  selectionTooLong
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    actions: { type: Array, value: [] },
    /** 被选中的那段文字。空字符串表示收起动作条 */
    text: { type: String, value: '' },
    /** 这段文字在屏幕上的位置，取自 createSelectorQuery 的 boundingClientRect */
    rect: { type: Object, value: null },
    /** 选区上限；超过就只提示、不给动作 */
    max: { type: Number, value: 2000 }
  },
  data: {
    open: false,
    tooLong: false,
    count: 0,
    excerpt: '',
    shownActions: [],
    style: '',
    placement: 'top'
  },
  observers: {
    'actions, text, rect, max': function () {
      this.build()
    }
  },
  methods: {
    build() {
      const { text, rect, max, actions } = this.data
      const usable = hasSelection(text, max)
      const tooLong = selectionTooLong(text, max)
      if (!usable && !tooLong) {
        this.setData({ open: false })
        return
      }

      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      // 浮条尺寸在这一端量不到，取一个够用的估值再交给公共层夹回屏幕
      const at = selectionAnchor(
        rect || { x: 0, y: 0, width: 0, height: 0 },
        { width: 240, height: 40 },
        { width: info.windowWidth, height: info.windowHeight }
      )
      this.setData({
        open: true,
        tooLong,
        count: selectionCount(text),
        excerpt: selectionExcerpt(text),
        shownActions: actions,
        placement: at.placement,
        style: `left:${at.x}px;top:${at.y}px`
      })
    },

    run(e) {
      const action = this.data.shownActions[Number(e.currentTarget.dataset.index)]
      if (!action || action.disabled || this.data.tooLong) return
      this.triggerEvent('select', { action, text: cleanSelection(this.data.text) })
      this.setData({ open: false })
    }
  }
})
