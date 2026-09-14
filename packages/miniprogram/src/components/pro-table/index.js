/**
 * ProTable —— 带查询层与列能力的表格（astra.md 的 B04 + B05）。
 *
 * 组件不发请求，只把「现在该请求什么」抛出去：取消、重试、鉴权在小程序上
 * 与 Web 完全不同，塞进组件就等于给每个项目一套用不上的实现。
 *
 * 列设置、排序三态、过期响应的判定都走公共层，与 Web 端同一份——
 * 否则同一批数据在小程序上会按另一种顺序排，而没有任何检查拦得住。
 *
 * 小程序没有 position: sticky 的可靠支持，固定列的替代路径是列设置面板里
 * 的「优先显示」：把该列移到最前面。这在 contracts/capability.ts 里没有登记为
 * 不支持——能力是在的，只是交互形态不同。
 */
import {
  DENSITY_ROW_HEIGHT,
  defaultColumnState,
  moveColumn,
  pageCount,
  resetColumns,
  resolveTableColumns,
  setDensity,
  setPage,
  setSort,
  toggleColumn
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    columns: { type: Array, value: [] },
    /** { query, rows, total, status, ... } */
    state: { type: Object, value: null },
    columnState: { type: Object, value: null },
    rowKey: { type: String, value: 'id' },
    emptyText: { type: String, value: '没有符合条件的数据' }
  },
  data: { panel: false, shown: [], resolved: [], rowHeight: 40, totalPages: 1, cells: [] },
  observers: {
    'columns, state, columnState': function () { this.refresh() }
  },
  lifetimes: {
    attached() { this.refresh() }
  },
  methods: {
    stateOf() {
      return this.data.state || { query: { sort: { key: null, order: null }, page: 1, pageSize: 20 }, rows: [], total: 0, status: 'idle' }
    },
    columnStateOf() {
      return this.data.columnState || this._inner || (this._inner = defaultColumnState(this.data.columns || []))
    },

    refresh() {
      const columns = this.data.columns || []
      const state = this.stateOf()
      const columnState = this.columnStateOf()
      const resolved = resolveTableColumns(columns, columnState)
      const shown = resolved.filter((c) => !c.hidden)
      // wxml 里取不了 row[column.key]，所以把每行摊平成一排单元格
      const cells = (state.rows || []).map((row, index) => ({
        key: String(row[this.data.rowKey] || index),
        values: shown.map((c) => ({ key: c.key, text: row[c.key] === undefined || row[c.key] === null ? '' : String(row[c.key]) }))
      }))
      this.setData({
        resolved: resolved.map((c) => Object.assign({}, c, {
          sortOrder: state.query.sort.key === c.key ? state.query.sort.order : ''
        })),
        shown: shown.map((c) => Object.assign({}, c, {
          sortOrder: state.query.sort.key === c.key ? state.query.sort.order : ''
        })),
        cells,
        rowHeight: DENSITY_ROW_HEIGHT[columnState.density],
        density: columnState.density,
        totalPages: pageCount(state.total || 0, state.query.pageSize)
      })
    },

    setColumnState(next) {
      this._inner = next
      this.triggerEvent('columnstatechange', { state: next })
      this.refresh()
    },

    ask(next) {
      this.triggerEvent('request', { query: next.query })
    },

    onSort(e) {
      const { key } = e.currentTarget.dataset
      this.ask(setSort(this.stateOf(), key))
    },

    onPage(e) {
      this.ask(setPage(this.stateOf(), Number(e.currentTarget.dataset.page)))
    },

    onTogglePanel() {
      this.setData({ panel: !this.data.panel })
    },

    onToggleColumn(e) {
      this.setColumnState(toggleColumn(this.columnStateOf(), e.currentTarget.dataset.key, this.data.columns || []))
    },

    /** 固定列的替代路径：把这一列移到最前面。小程序上 sticky 靠不住 */
    onPrioritize(e) {
      const { key } = e.currentTarget.dataset
      const state = this.columnStateOf()
      const from = state.settings.findIndex((s) => s.key === key)
      if (from < 0) return
      this.setColumnState(moveColumn(state, from, 0))
    },

    onDensity(e) {
      this.setColumnState(setDensity(this.columnStateOf(), e.currentTarget.dataset.value))
    },

    onReset() {
      this.setColumnState(resetColumns(this.data.columns || []))
    }
  }
})
