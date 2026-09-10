/**
 * Carousel —— 走马灯（移动端也叫 Swiper）。
 *
 * 不用小程序内置的 <swiper>：它的翻页判定、指示点收窗规则与 Web 端对不上，
 * 同一份数据在两端上「轻轻一划翻没翻页」的答案会不一样。
 * 判定全部走公共层的 resolveSwipe / dotRange。
 */
import { dotRange, nextIndex, resolveSwipe, rubberBand, shouldAutoplay, trackOffset } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    items: { type: Array, value: [] },
    current: { type: Number, value: 0 },
    /** 自动播放间隔（毫秒）；0 表示不自动播放 */
    interval: { type: Number, value: 0 },
    loop: { type: Boolean, value: true },
    height: { type: Number, value: 200 },
    /** 指示点最多显示几个，超出就只显示当前页附近的一段 */
    maxDots: { type: Number, value: 7 }
  },
  data: { offset: 0, dots: [], dragging: false },
  observers: {
    'items, current, maxDots': function () {
      this.refresh()
    }
  },
  lifetimes: {
    attached() {
      this.drag = null
      this.measure()
      this.refresh()
    },
    detached() { this.stop() }
  },
  pageLifetimes: {
    // 页面切到后台还继续翻是纯粹的耗电，而且用户切回来看到的是随机一张
    hide() { this.hidden = true; this.schedule() },
    show() { this.hidden = false; this.schedule() }
  },
  methods: {
    measure() {
      this.createSelectorQuery()
        .select('.i-carousel')
        .boundingClientRect((rect) => {
          this.width = rect ? rect.width : 0
        })
        .exec()
    },

    refresh() {
      const { current, items, maxDots, loop } = this.data
      const range = dotRange(current, items.length, maxDots)
      this.setData({
        dots: range.items,
        offset: rubberBand(trackOffset(current, this.drag ? this.drag.dx : 0, this.width || 1), items.length, loop)
      })
      this.schedule()
    },

    go(delta) {
      const next = nextIndex(this.data.current, this.data.items.length, delta, this.data.loop)
      this.setData({ current: next })
      this.triggerEvent('change', { current: next })
    },

    onDotTap(e) {
      const target = Number(e.currentTarget.dataset.index)
      this.setData({ current: target })
      this.triggerEvent('change', { current: target })
    },

    onTouchStart(e) {
      if (this.data.items.length <= 1) return
      this.drag = { startX: e.touches[0].clientX, dx: 0, at: Date.now() }
      this.setData({ dragging: true })
      this.schedule()
    },

    onTouchMove(e) {
      if (!this.drag) return
      this.drag.dx = e.touches[0].clientX - this.drag.startX
      this.setData({
        offset: rubberBand(
          trackOffset(this.data.current, this.drag.dx, this.width || 1),
          this.data.items.length,
          this.data.loop
        )
      })
    },

    onTouchEnd() {
      if (!this.drag) return
      // 位移与速度任一达标就翻页：只看位移会把手机上最自然的短促轻扫判成「没划够」
      const direction = resolveSwipe(this.drag.dx, this.width || 1, Date.now() - this.drag.at)
      this.drag = null
      this.setData({ dragging: false })
      if (direction) this.go(direction)
      else this.refresh()
    },

    stop() {
      if (this.timer) clearTimeout(this.timer)
      this.timer = null
    },

    /*
     * 一次性的 timeout 链而不是 setInterval：
     * interval 型定时器在页面卡顿后会把攒下的几次一起补发，画面会连翻好几张。
     */
    schedule() {
      this.stop()
      const playing = shouldAutoplay({
        enabled: this.data.interval > 0,
        count: this.data.items.length,
        dragging: !!this.drag,
        documentHidden: !!this.hidden
      })
      if (!playing) return
      this.timer = setTimeout(() => {
        this.go(1)
        this.schedule()
      }, this.data.interval)
    }
  }
})
