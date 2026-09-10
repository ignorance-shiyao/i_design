/**
 * Tour —— 新手引导。
 *
 * 高亮框与气泡落位走公共层：与 Web 端同一套翻转、夹取规则，
 * 同一份步骤在两端上不会一个指着按钮、一个指偏半个屏幕。
 */
import { resolveOverlay, tourHole, tourNext, tourPrev } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    steps: { type: Array, value: [] },
    /** 当前步；-1 表示不显示 */
    current: { type: Number, value: -1 },
    /** 高亮框向外扩多少 */
    padding: { type: Number, value: 6 }
  },
  data: { step: null, hole: null, pop: { x: 0, y: 0 }, isLast: false },
  observers: {
    'steps, current': function (steps, current) {
      const step = steps[current] || null
      this.setData({ step, isLast: current === steps.length - 1 })
      if (step) this.locate(step)
      else this.setData({ hole: null })
    }
  },
  methods: {
    locate(step) {
      const query = this.createSelectorQuery()
      // 目标在页面上而不是组件内，必须跨自定义组件边界查
      query.select(step.target).boundingClientRect()
      query.selectViewport().boundingClientRect()
      query.select('.i-tour__pop').boundingClientRect()
      query.exec((res) => {
        const rect = res[0]
        const viewport = res[1]
        const box = res[2]
        if (!rect || !viewport) {
          // 目标不存在（页面还没渲染到那一块）：不画洞，气泡居中，引导仍然能走完
          this.setData({ hole: null })
          return
        }
        const hole = tourHole(rect, { padding: this.data.padding })
        const resolved = box
          ? resolveOverlay({
              trigger: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
              popup: { x: 0, y: 0, width: box.width, height: box.height },
              viewport: { x: 0, y: 0, width: viewport.width, height: viewport.height },
              placement: step.placement || 'bottom',
              offset: this.data.padding + 10
            })
          : { x: 0, y: 0 }
        this.setData({
          hole: { ...hole, x: rect.left - this.data.padding, y: rect.top - this.data.padding },
          pop: { x: resolved.x, y: resolved.y }
        })
      })
    },

    next() {
      const target = tourNext(this.data.current, this.data.steps.length)
      this.setData({ current: target })
      this.triggerEvent('change', { current: target })
      // 到末步返回 -1 而不是停住：停在末步时按钮点下去没有任何变化，
      // 用户不知道是走完了还是卡住了
      if (target === -1) this.triggerEvent('finish')
    },

    prev() {
      const target = tourPrev(this.data.current)
      this.setData({ current: target })
      this.triggerEvent('change', { current: target })
    },

    skip() {
      this.setData({ current: -1 })
      this.triggerEvent('change', { current: -1 })
      this.triggerEvent('skip')
    }
  }
})
