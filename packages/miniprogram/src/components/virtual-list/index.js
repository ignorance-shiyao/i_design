/**
 * VirtualList —— 虚拟滚动。
 *
 * 小程序的 scroll-view 本身不做虚拟化，一万条数据 setData 一次就会卡住主线程。
 * 窗口计算走公共层：overscan 默认 3 行，少了快速拖动时上下边缘会闪空白，
 * 多了等于没虚拟化——那些行永远来不及被看见。
 */
import { shouldVirtualize, virtualWindow } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    items: { type: Array, value: [] },
    /** 每行高度，像素。定高才能不量元素直接算窗口 */
    itemHeight: { type: Number, value: 40 },
    height: { type: Number, value: 320 },
    /** 上下各多渲染几行 */
    overscan: { type: Number, value: 3 },
    /** 用具名插槽自定义行内容；否则直接渲染 item.label */
    useSlot: { type: Boolean, value: false }
  },
  data: { visible: [], paddingTop: 0, paddingBottom: 0, virtual: false },
  observers: {
    'items, itemHeight, height, overscan': function () { this.refresh(0) }
  },
  lifetimes: { attached() { this.refresh(0) } },
  methods: {
    onScroll(e) {
      // 每帧最多算一次：scroll 事件比刷新率密，不节流会白算很多遍
      if (this.pending) return
      this.pending = true
      setTimeout(() => {
        this.pending = false
        this.refresh(e.detail.scrollTop)
      }, 16)
    },

    refresh(scrollTop) {
      const { items, itemHeight, height, overscan } = this.data
      const virtual = shouldVirtualize(items.length)
      if (!virtual) {
        this.setData({
          virtual: false,
          visible: items.map((item, index) => ({ ...item, index })),
          paddingTop: 0,
          paddingBottom: 0
        })
        return
      }
      const win = virtualWindow(scrollTop, height, itemHeight, items.length, overscan)
      this.setData({
        virtual: true,
        visible: items.slice(win.start, win.end + 1).map((item, i) => ({ ...item, index: win.start + i })),
        paddingTop: win.paddingTop,
        paddingBottom: win.paddingBottom
      })
    }
  }
})
