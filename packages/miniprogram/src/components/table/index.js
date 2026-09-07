/**
 * Table —— 小程序没有可用的 <table> 布局，改用 flex 行列模拟；
 * 但排序规则（三态循环与比较）来自公共层，与 Web 端逐字相同。
 */
import { nextSortOrder, sortRows } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    columns: { type: Array, value: [] },
    data: { type: Array, value: [] },
    rowKey: { type: String, value: 'id' },
    size: { type: String, value: 'md' },
    striped: { type: Boolean, value: false },
    loading: { type: Boolean, value: false },
    emptyText: { type: String, value: '暂无数据' }
  },
  data: { rows: [], sortKey: null, sortOrder: null },
  observers: {
    'data, rowKey': function () {
      this.applySort()
    }
  },
  methods: {
    applySort() {
      const { data, rowKey, sortKey, sortOrder } = this.data
      const sorted = sortRows(data, sortKey, sortOrder)
      // WXML 的 wx:key 需要稳定字符串
      this.setData({ rows: sorted.map((r, i) => ({ ...r, _key: String(r[rowKey] ?? i) })) })
    },
    onSort(e) {
      const { key, sortable } = e.currentTarget.dataset
      if (!sortable) return
      if (this.data.sortKey !== key) {
        this.setData({ sortKey: key, sortOrder: 'asc' }, () => this.applySort())
        return
      }
      const next = nextSortOrder(this.data.sortOrder)
      this.setData({ sortOrder: next, sortKey: next === null ? null : key }, () => this.applySort())
    }
  }
})
