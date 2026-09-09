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
  toggleChecked,
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
    emptyText: { type: String, value: '没有匹配的节点' }
  },
  data: { rows: [], keyword: '' },
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
      this.setData({
        rows: rows.map((row) => ({
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
      })
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
        const next = !this.data.rows.find((row) => row.key === key).checked
        this.triggerEvent('checkchange', {
          keys: [...toggleChecked(this.entities, this.data.checked, key, next)]
        })
        return
      }
      this.triggerEvent('select', { key, node: entity.node })
    }
  }
})
