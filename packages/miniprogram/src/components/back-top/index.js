/**
 * BackTop —— 回到顶部。
 *
 * 阈值判定走公共层：默认一屏，不足一屏时用户自己往回划两下就到顶了，
 * 这时冒出一个按钮属于帮倒忙——它遮住的内容比它省下的力气多。
 */
import { shouldShowBackTop } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** 滚过多少像素才露出来。负值表示用一屏高 */
    threshold: { type: Number, value: -1 },
    duration: { type: Number, value: 320 }
  },
  data: { visible: false },
  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this.viewportHeight = info.windowHeight
    }
  },
  methods: {
    /** 由页面在 onPageScroll 里转交：小程序的滚动事件在页面上，组件收不到 */
    onPageScroll(scrollTop) {
      const visible = shouldShowBackTop(
        scrollTop,
        this.viewportHeight,
        this.data.threshold >= 0 ? this.data.threshold : undefined
      )
      if (visible !== this.data.visible) this.setData({ visible })
    },

    toTop() {
      // 小程序自带滚动动画且时长可控，不必像 Web 端那样自己按帧算
      wx.pageScrollTo({ scrollTop: 0, duration: this.data.duration })
      this.triggerEvent('click')
    }
  }
})
