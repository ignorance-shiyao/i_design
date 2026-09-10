/**
 * Sticky —— 吸顶。
 *
 * 吸附本身交给 CSS 的 position: sticky（基础库 2.x 起支持），
 * JS 只负责算出「此刻是不是吸住了」，因为 CSS 至今给不出这个答案。
 * 判定走公共层的 resolveAffix，与 Web 端同一条阈值。
 */
import { resolveAffix } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** 距容器顶部多少像素时吸住 */
    top: { type: Number, value: 0 },
    /** 滚动容器选择器。不传则相对页面 */
    container: { type: String, value: '' }
  },
  data: { stuck: false },
  methods: {
    /** 由外层 scroll-view 的 bindscroll 或页面 onPageScroll 转交 */
    onScroll(scrollTop, viewportHeight) {
      const query = this.createSelectorQuery()
      query.select('.i-sticky__sentinel').boundingClientRect()
      if (this.data.container) query.select(this.data.container).boundingClientRect()
      else query.selectViewport().boundingClientRect()
      query.select('.i-sticky__inner').boundingClientRect()
      query.exec((res) => {
        const flag = res[0]
        const box = res[1]
        const inner = res[2]
        if (!flag || !box || !inner) return
        const next = resolveAffix(
          {
            offsetTop: flag.top - box.top + scrollTop,
            height: inner.height,
            scrollTop,
            viewportHeight: viewportHeight || box.height
          },
          { top: this.data.top }
        )
        const stuck = next.mode !== 'none'
        if (stuck !== this.data.stuck) {
          this.setData({ stuck })
          this.triggerEvent('change', { stuck })
        }
      })
    }
  }
})
