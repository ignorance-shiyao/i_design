/**
 * PullRefresh —— 下拉刷新。
 *
 * 小程序自带 scroll-view 的 refresher，但它的阈值与文案由基础库定，
 * 各端于是对不上。位移、阈值、文案一律走公共层的 logic/pullrefresh，
 * 手感与 Web 端保持同一套。
 */
import {
  PULL_MAX,
  PULL_THRESHOLD,
  pullDistance,
  pullHint,
  pullStatus,
  refreshingOffset,
  shouldRefresh
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** 拉到这里松手才刷新 */
    threshold: { type: Number, value: PULL_THRESHOLD },
    /** 最多能拉这么远 */
    max: { type: Number, value: PULL_MAX },
    disabled: { type: Boolean, value: false }
  },
  data: { distance: 0, status: 'idle', hint: '', animating: true },
  methods: {
    /**
     * 只在列表已经滚到顶部时才接管手势。
     * 由外层 scroll-view 的 bindscroll 把 scrollTop 转交进来——
     * 不判断的话，用户在列表中间往下滑会被下拉刷新吃掉，
     * 列表不动、顶上却冒出提示，看起来像卡住了。
     */
    setScrollTop(scrollTop) {
      this._atTop = scrollTop <= 0
    },
    onStart(event) {
      if (this.data.disabled || this.data.status === 'refreshing') return
      if (this._atTop === false) return
      this._pulling = true
      this._startY = event.touches[0].clientY
      this.setData({ animating: false })
    },
    onMove(event) {
      if (!this._pulling) return
      const delta = event.touches[0].clientY - this._startY
      if (delta <= 0) {
        // 反向滑动交还给列表：这时用户是想往下看，不是想刷新
        this._pulling = false
        this.setData({ distance: 0, status: 'idle', hint: '', animating: true })
        return
      }
      const distance = pullDistance(delta, this.data.max)
      const status = pullStatus(distance, this.data.threshold)
      this.setData({ distance, status, hint: pullHint(status) })
    },
    onEnd() {
      if (!this._pulling) return
      this._pulling = false
      if (!shouldRefresh(this.data.distance, this.data.threshold)) {
        this.setData({ distance: 0, status: 'idle', hint: '', animating: true })
        return
      }
      // 停在阈值处而不是收回零：收回零的话指示器立刻消失，用户会再拉一次
      this.setData({
        distance: refreshingOffset(this.data.threshold),
        status: 'refreshing',
        hint: pullHint('refreshing'),
        animating: true
      })
      this.triggerEvent('refresh')
    },
    /** 由调用方在数据到位后调用；组件不猜什么时候算刷新完了 */
    finish() {
      this.setData({ status: 'done', hint: pullHint('done') })
      setTimeout(() => this.setData({ distance: 0, status: 'idle', hint: '' }), 300)
    }
  }
})
