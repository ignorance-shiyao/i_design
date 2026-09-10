/**
 * IndexBar —— 索引栏。
 *
 * 分组顺序与手指命中都走公共层的 logic/indexbar：
 *「#」排最后、按格命中而非按最近——这两条各端一旦自己实现就会出现两种表现。
 */
import { activeIndex, groupByIndex, indexAt } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    /** 从条目里取出用于分组的字段（通常是拼音首字母） */
    indexKey: { type: String, value: 'index' },
    labelKey: { type: String, value: 'label' },
    height: { type: Number, value: 360 }
  },
  data: { groups: [], active: 0, hint: '', scrollTo: '' },
  observers: {
    'items, indexKey'(items, indexKey) {
      this.setData({
        groups: groupByIndex(items || [], (item) => String(item[indexKey] || ''))
      })
      // 分组变了，之前量好的位置全部作废
      this._offsets = null
    }
  },
  methods: {
    /** 量出每个分组标题距滚动区顶部多远，滚动高亮要靠它 */
    measure(done) {
      const query = this.createSelectorQuery()
      query.select('.i-indexbar__scroll').boundingClientRect()
      query.selectAll('.i-indexbar__title').boundingClientRect()
      query.exec((res) => {
        const box = res[0]
        const titles = res[1] || []
        if (!box) return
        this._offsets = titles.map((t) => t.top - box.top)
        if (done) done()
      })
    },
    onScroll(event) {
      if (!this._offsets) return this.measure()
      this.setData({ active: activeIndex(this._offsets, event.detail.scrollTop) })
    },
    jump(index) {
      const groups = this.data.groups
      if (index < 0 || index >= groups.length) return
      // 用 scroll-into-view 而不是算 scrollTop：小程序里前者不依赖测量，也不会被回弹带偏
      this.setData({ active: index, hint: groups[index].key, scrollTo: 'i-idx-' + groups[index].key })
    },
    /*
     * 用「落在哪一格」而不是「离哪个字母最近」：
     * 最近判定在两格交界处会来回跳，手指几乎没动、列表却在两个分组之间反复横跳。
     */
    onBarTouch(event) {
      const query = this.createSelectorQuery()
      query.select('.i-indexbar__bar').boundingClientRect((rect) => {
        if (!rect) return
        this.jump(indexAt(event.touches[0].clientY - rect.top, rect.height, this.data.groups.length))
      })
      query.exec()
    },
    onLetterTap(event) {
      this.jump(event.currentTarget.dataset.index)
    },
    clearHint() {
      this.setData({ hint: '' })
    }
  }
})
