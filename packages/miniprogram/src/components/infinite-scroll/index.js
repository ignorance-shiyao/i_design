/**
 * InfiniteScroll —— 无限滚动。
 *
 * 不只靠 scroll-view 的 bindscrolltolower：那个事件在「内容没撑满容器」时
 * 根本不会触发——第一页太短就没有滚动条，用户再怎么划也到不了底，
 * 列表会永远停在第一页。所以另外量一次尺寸，判定统一走公共层的 shouldLoadMore。
 */
import { canLoad, loadHint, shouldLoadMore } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    status: { type: String, value: 'idle' },
    /** 距底多少像素开始加载 */
    threshold: { type: Number, value: 120 },
    height: { type: Number, value: 320 },
    /** 一条都没有时，「没有更多了」要换成「暂无内容」 */
    empty: { type: Boolean, value: false }
  },
  data: { hint: '' },
  observers: {
    'status, empty': function (status, empty) {
      this.setData({ hint: loadHint(status, empty) })
      // 状态回到 idle 说明上一页已落地，复查一次是否还没撑满
      if (status === 'idle') this.check()
    }
  },
  lifetimes: {
    attached() {
      this.setData({ hint: loadHint(this.data.status, this.data.empty) })
      this.check()
    }
  },
  methods: {
    check() {
      this.createSelectorQuery()
        .select('.i-infinite')
        .fields({ size: true, scrollOffset: true }, (res) => {
          if (!res) return
          const metrics = {
            scrollTop: res.scrollTop || 0,
            clientHeight: res.height || 0,
            scrollHeight: res.scrollHeight || 0
          }
          if (shouldLoadMore(metrics, this.data.status, this.data.threshold)) {
            this.triggerEvent('load')
          }
        })
        .exec()
    },

    onScroll(e) {
      if (
        shouldLoadMore(
          {
            scrollTop: e.detail.scrollTop,
            clientHeight: this.data.height,
            scrollHeight: e.detail.scrollHeight
          },
          this.data.status,
          this.data.threshold
        )
      ) {
        this.triggerEvent('load')
      }
    },

    /* 平台自己判定的「滚到底」。距底判定它已经做完了，这里只补上状态闸门 */
    onLower() {
      if (canLoad(this.data.status)) this.triggerEvent('load')
    },

    onRetry() { this.triggerEvent('retry') }
  }
})
