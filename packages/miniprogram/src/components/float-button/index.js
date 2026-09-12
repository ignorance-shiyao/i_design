/**
 * FloatButton —— 悬浮操作按钮。
 *
 * 一页只该有一个：它代表「这一页最主要的那件事」。出现两个就等于没有主次。
 * 展开后的几何走公共层，与 Web 端同一份——各端自己写间距的话，
 * 同一个组件在三端会错开几像素。
 */
import { floatActionDelay, floatActionShift } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    icon: { type: String, value: 'plus' },
    /** 带文字时按钮拉长；只有图标时收成正圆 */
    text: { type: String, value: '' },
    /** [{ key, icon, label }]，为空时只发 click */
    actions: { type: Array, value: [] },
    placement: { type: String, value: 'bottom-right' },
    offset: { type: Number, value: 24 }
  },
  data: { expanded: false, items: [] },
  observers: {
    actions(actions) {
      // 位移与延迟在这里算好交给模板：WXML 里没法调用函数
      this.setData({
        items: (actions || []).map((action, index) => ({
          ...action,
          offset: floatActionShift(index),
          delay: floatActionDelay(index, actions.length),
          initial: action.label ? action.label.slice(0, 1) : ''
        }))
      })
    }
  },
  methods: {
    toggle() {
      if (!this.data.items.length) {
        this.triggerEvent('click')
        return
      }
      const expanded = !this.data.expanded
      this.setData({ expanded })
      this.triggerEvent('openchange', { open: expanded })
    },
    choose(e) {
      this.setData({ expanded: false })
      this.triggerEvent('select', { key: e.currentTarget.dataset.key })
      this.triggerEvent('openchange', { open: false })
    }
  }
})
