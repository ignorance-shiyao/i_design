/**
 * Tree —— 层级数据的展开与选择。
 *
 * 与 Web 端共用 logic/tree：展开、半选、禁用继承、搜索命中路径这几处判断
 * 都不重写。小程序没有递归组件的便利写法，正好——这里本来就渲染的是拍平后的行。
 */
import {
  flattenTree,
  resolveCheckState,
  searchTree,
  shouldVirtualize,
  toggleChecked,
  virtualWindow,
  visibleRows
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    data: { type: Array, value: [] },
    checked: { type: Array, value: [] },
    expanded: { type: Array, value: [] },
    checkable: { type: Boolean, value: false },
    searchable: { type: Boolean, value: false },
    selected: { type: String, value: '' },
    /**
     * 列表区高度（px）。给了才能虚拟化——没有可视高度就算不出该渲染哪几行。
     * 不给时整棵树平铺，由页面滚动。
     */
    height: { type: Number, value: 0 },
    /** 量不到行高时的兜底值（px） */
    rowHeight: { type: Number, value: 32 },
    emptyText: { type: String, value: '没有匹配的节点' }
  },
  data: {
    rows: [],
    visible: [],
    keyword: '',
    virtual: false,
    paddingTop: 0,
    paddingBottom: 0,
    measuredRow: 32,
    scrollTop: 0,
    total: 0
  },
  observers: {
    'data, checked, expanded, selected': function () {
      this.rebuild()
    }
  },
  lifetimes: { attached() { this.rebuild() } },
  methods: {
    rebuild() {
      const entities = flattenTree(this.data.data)
      this.entities = entities
      const keyword = this.data.keyword
      const filtering = keyword.trim().length > 0
      const search = searchTree(entities, keyword)
      // 搜索时用命中路径覆盖展开态，但不写回调用方
      const expanded = filtering ? [...search.expand] : (this.localExpanded || this.data.expanded)
      const state = resolveCheckState(entities, this.data.checked)
      const rows = visibleRows(
        this.data.data,
        entities,
        expanded,
        filtering ? search.visible : undefined
      )
      /*
       * WXML 里做不了 Set.has 与字符串切分，把每行需要的展示状态在这里算完。
       * 高亮片段也一并切好——模板里没有能力按关键字拆字符串。
       */
      this.allRows = rows.map((row) => ({
        key: row.key,
        label: row.node.label,
        parts: this.split(row.node.label, keyword.trim()),
        level: row.level,
        indent: row.level * 20 + 4,
        hasChildren: row.hasChildren,
        expanded: row.expanded,
        disabled: row.disabled,
        checked: state.checked.has(row.key),
        half: state.halfChecked.has(row.key),
        selected: !this.data.checkable && this.data.selected === row.key
      }))
      this.setData({ total: this.allRows.length }, () => {
        this.window()
        this.measure()
      })
    },

    /**
     * 只渲染看得见的那十来行。窗口计算与 Web 端共用 logic/virtual，
     * 因此两端在同一个滚动位置露出的是同一批行。
     */
    window() {
      const all = this.allRows || []
      const { height, scrollTop, measuredRow } = this.data
      if (!height || !shouldVirtualize(all.length)) {
        this.setData({ virtual: false, visible: all, rows: all })
        return
      }
      const win = virtualWindow(scrollTop, height, measuredRow, all.length)
      this.setData({
        virtual: true,
        rows: all,
        visible: all.slice(win.start, win.end + 1),
        paddingTop: win.paddingTop,
        paddingBottom: win.paddingBottom
      })
    },

    /* 这一端读不到 offsetHeight，量一次；量不到才退回兜底值，不拿写死的数去算位置 */
    measure() {
      if (!this.data.height) return
      const query = this.createSelectorQuery()
      query.select('.i-tree__row').boundingClientRect()
      query.exec((res) => {
        const rect = res && res[0]
        if (rect && rect.height > 0 && rect.height !== this.data.measuredRow) {
          this.setData({ measuredRow: rect.height }, () => this.window())
        }
      })
    },

    onScroll(event) {
      this.setData({ scrollTop: event.detail.scrollTop }, () => this.window())
    },

    split(label, needle) {
      if (!needle) return [{ text: label, hit: false }]
      const parts = []
      let rest = label
      let index = rest.toLowerCase().indexOf(needle.toLowerCase())
      while (index !== -1) {
        if (index > 0) parts.push({ text: rest.slice(0, index), hit: false })
        parts.push({ text: rest.slice(index, index + needle.length), hit: true })
        rest = rest.slice(index + needle.length)
        index = rest.toLowerCase().indexOf(needle.toLowerCase())
      }
      if (rest) parts.push({ text: rest, hit: false })
      return parts
    },

    onSearch(event) {
      this.setData({ keyword: event.detail.value }, () => this.rebuild())
    },

    onToggle(event) {
      if (this.data.keyword.trim()) return
      const key = event.currentTarget.dataset.key
      const current = new Set(this.localExpanded || this.data.expanded)
      if (current.has(key)) current.delete(key)
      else current.add(key)
      this.localExpanded = [...current]
      this.rebuild()
      this.triggerEvent('expandchange', { keys: this.localExpanded })
    },

    onRow(event) {
      const { key, disabled } = event.currentTarget.dataset
      if (disabled) return
      const entity = this.entities.get(key)
      if (!entity) return
      if (this.data.checkable) {
        const hit = (this.allRows || []).find((row) => row.key === key)
        const next = !(hit && hit.checked)
        this.triggerEvent('checkchange', {
          keys: [...toggleChecked(this.entities, this.data.checked, key, next)]
        })
        return
      }
      this.triggerEvent('select', { key, node: entity.node })
    }
  }
})
