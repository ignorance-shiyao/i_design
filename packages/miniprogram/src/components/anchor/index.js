/**
 * Anchor —— 页内锚点。
 * 小程序没有 window.scrollY，位置靠 createSelectorQuery 查；
 * 「当前章节」的判定仍用共享的 activeAnchor，含触底选中最后一项这条规则。
 */
import { activeAnchor } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    offset: { type: Number, value: 80 }
  },
  data: { active: '' },
  methods: {
    /** 由页面在 onPageScroll 里调用，小程序拿不到全局滚动事件 */
    update(scrollTop) {
      const query = this.createSelectorQuery().in(this)
      query.selectViewport().boundingClientRect()
      query.selectViewport().scrollOffset()
      query.exec((res) => {
        const rect = res[0]
        const scroll = res[1]
        if (!rect || !scroll) return
        const targets = this.data.items.map((item, index) => ({
          key: item.key,
          top: item.top != null ? item.top : index * 400
        }))
        const active = activeAnchor(targets, {
          scrollTop: scrollTop != null ? scrollTop : scroll.scrollTop,
          viewportHeight: rect.height,
          documentHeight: scroll.scrollHeight,
          offset: this.data.offset
        })
        if (active !== this.data.active) {
          this.setData({ active })
          this.triggerEvent('change', { key: active })
        }
      })
    },
    onJump(e) {
      const key = e.currentTarget.dataset.key
      this.setData({ active: key })
      this.triggerEvent('jump', { key })
    }
  }
})
