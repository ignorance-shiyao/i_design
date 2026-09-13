/**
 * Splitter —— 分割面板。
 *
 * 触摸端没有键盘，也没有 col-resize 光标，所以抓手默认常显——
 * Web 端可以靠光标变化提示「这里能拖」，这一端只能靠看得见的抓手。
 * 夹取规则走公共层：两栏的下限一起夹，只夹一栏的话另一栏会被挤到零宽。
 */
import { paneRatio, resetPaneSize, resizePane } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** 第一栏占比 0-1 */
    value: { type: Number, value: 0.5 },
    direction: { type: String, value: 'horizontal' },
    /** 两栏各自的最小尺寸，像素 */
    minFirst: { type: Number, value: 120 },
    minSecond: { type: Number, value: 120 },
    maxFirst: { type: Number, value: 0 },
    gutter: { type: Number, value: 4 },
    /** 双击分隔条复位到这个比例 */
    resetTo: { type: Number, value: 0.5 },
    height: { type: Number, value: 0 }
  },
  data: { dragging: false, percent: 50, rootStyle: '' },
  observers: {
    'value': function (v) { this.setData({ percent: Math.round(v * 100) }) },
    'height': function (h) { this.setData({ rootStyle: h ? 'height:' + h + 'px' : '' }) }
  },
  methods: {
    measure(cb) {
      this.createSelectorQuery()
        .select('.i-splitter')
        .boundingClientRect((rect) => {
          if (!rect) return
          this.rect = rect
          this.total = this.data.direction === 'horizontal' ? rect.width : rect.height
          cb && cb()
        })
        .exec()
    },

    onDown() {
      this.setData({ dragging: true })
      this.measure()
    },

    onMove(e) {
      if (!this.data.dragging || !this.rect) return
      const touch = e.touches[0]
      const next = this.data.direction === 'horizontal'
        ? touch.clientX - this.rect.left
        : touch.clientY - this.rect.top
      const clamped = resizePane(
        this.total,
        next,
        { min: this.data.minFirst, max: this.data.maxFirst || undefined },
        { min: this.data.minSecond },
        this.data.gutter
      )
      const ratio = paneRatio(clamped, this.total, this.data.gutter)
      this.setData({ value: ratio })
      this.triggerEvent('change', { value: ratio })
    },

    onUp() { this.setData({ dragging: false }) },

    /*
     * 双击分隔条复位。
     *
     * 这一端没有键盘等价物，双击是唯一的复位手势，所以更不能省。
     * 复位照样过一遍夹取：容器变窄之后，五五开算出来的第一栏可能比 minFirst 还小，
     * 直接写回比例会得到一个拖都拖不出来的状态。
     */
    reset() {
      this.measure(() => {
        const size = resetPaneSize(
          this.data.resetTo,
          this.total,
          { min: this.data.minFirst, max: this.data.maxFirst || undefined },
          { min: this.data.minSecond },
          this.data.gutter
        )
        const ratio = paneRatio(size, this.total, this.data.gutter)
        this.setData({ value: ratio })
        this.triggerEvent('change', { value: ratio })
      })
    }
  }
})
