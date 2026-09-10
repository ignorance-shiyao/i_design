/**
 * Transfer —— 穿梭框。
 *
 * 搬运、勾选与全选的规则全部走公共层：
 * 「搬走之后勾选怎么办」「搜索时全选选的是谁」这两处各端极容易给出不同答案，
 * 而两种答案都说得通——正因如此才必须只写一份。
 */
import {
  checkedAfterMove,
  filterItems,
  headerState,
  moveKeys,
  splitSides,
  toggleAll,
  toggleItem
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    /** 右栏的 key，顺序即用户搬过去的顺序 */
    value: { type: Array, value: [] },
    titles: { type: Array, value: ['待选', '已选'] },
    searchable: { type: Boolean, value: true },
    height: { type: Number, value: 260 }
  },
  data: { panes: [], sourceChecked: false, targetChecked: false },
  observers: {
    'items, value, titles': function () { this.refresh() }
  },
  lifetimes: {
    attached() {
      this.checked = { source: [], target: [] }
      this.keyword = { source: '', target: '' }
      this.refresh()
    }
  },
  methods: {
    refresh() {
      const sides = splitSides(this.data.items, this.data.value)
      const titles = this.data.titles
      const panes = ['source', 'target'].map((side, i) => {
        const visible = filterItems(sides[side], this.keyword[side])
        const state = headerState(visible, this.checked[side])
        return {
          side,
          title: titles[i],
          keyword: this.keyword[side],
          visible: visible.map((item) => ({
            ...item,
            checked: this.checked[side].indexOf(item.key) >= 0
          })),
          checked: state.checked,
          selectable: state.selectable,
          allChecked: state.allChecked,
          someChecked: state.someChecked
        }
      })
      this.setData({
        panes,
        sourceChecked: this.checked.source.length > 0,
        targetChecked: this.checked.target.length > 0
      })
    },

    onSearch(e) {
      this.keyword[e.currentTarget.dataset.side] = e.detail.value
      this.refresh()
    },

    onToggle(e) {
      const { side, key } = e.currentTarget.dataset
      const item = this.data.items.filter((i) => i.key === key)[0]
      if (!item || item.disabled) return
      this.checked[side] = toggleItem(this.checked[side], key)
      this.refresh()
    },

    onToggleAll(e) {
      const side = e.currentTarget.dataset.side
      const pane = this.data.panes.filter((p) => p.side === side)[0]
      if (!pane) return
      this.checked[side] = toggleAll(pane.visible, this.checked[side])
      this.refresh()
    },

    onMove(e) {
      const to = e.currentTarget.dataset.to
      const from = to === 'target' ? 'source' : 'target'
      const moving = this.checked[from]
      if (!moving.length) return
      const next = moveKeys(this.data.items, this.data.value, moving, to)
      // 搬走的要从勾选里清掉，否则会出现「已选 3 项」而屏幕上一个勾都没有
      this.checked[from] = checkedAfterMove(this.checked[from], moving)
      this.setData({ value: next })
      this.triggerEvent('change', { value: next })
      this.refresh()
    }
  }
})
