/**
 * Affix —— 固钉。
 *
 * 不用 position: sticky：小程序里它在 scroll-view 内的表现各基础库版本不一，
 * 而且给不出「容器滚出视口时跟着走」这条。判定走公共层，与 Web 端同一条阈值。
 */
import { resolveAffix } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** 距视口顶部多少像素时吸住 */
    top: { type: Number, value: 0 },
    /** 距视口底部多少像素时吸住。传了就以它为准 */
    bottom: { type: Number, value: -1 },
    /** 容器选择器：容器滚出视口时元素跟着一起走 */
    container: { type: String, value: '' }
  },
  data: { mode: 'none', offset: 0, placeholder: 0 },
  lifetimes: {
    attached() {
      this.pageScrollTop = 0
      this.measure()
    }
  },
  pageLifetimes: {
    show() { this.measure() }
  },
  methods: {
    /** 页面滚动时由页面调用：小程序的滚动事件在页面上，组件收不到 */
    onPageScroll(scrollTop) {
      this.pageScrollTop = scrollTop
      this.measure()
    },

    measure() {
      const query = this.createSelectorQuery()
      query.select('.i-affix').boundingClientRect()
      query.select('.i-affix__inner').boundingClientRect()
      query.selectViewport().boundingClientRect()
      if (this.data.container) query.select(this.data.container).boundingClientRect()
      query.exec((res) => {
        const outer = res[0]
        const inner = res[1]
        const viewport = res[2]
        const container = res[3]
        if (!outer || !inner || !viewport) return

        const scrollTop = this.pageScrollTop
        const next = resolveAffix(
          {
            offsetTop: outer.top + scrollTop,
            height: inner.height,
            scrollTop,
            viewportHeight: viewport.height,
            containerBottom: container ? container.bottom + scrollTop : undefined
          },
          this.data.bottom >= 0 ? { bottom: this.data.bottom } : { top: this.data.top }
        )

        if (next.mode !== this.data.mode) this.triggerEvent('change', { affixed: next.mode !== 'none' })
        this.setData({
          mode: next.mode,
          offset: next.offset,
          // 占位高度：不占位的话下面的内容会整块往上跳一次
          placeholder: next.mode === 'none' ? 0 : inner.height
        })
      })
    }
  }
})
