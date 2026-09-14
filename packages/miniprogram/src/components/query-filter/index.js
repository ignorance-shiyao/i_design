/**
 * QueryFilter —— 列表页上方那一排查询条件（astra.md 的 B03）。
 *
 * 状态机走公共层的 logic/query，与 Web 端同一份：条件一变回第一页、
 * 快捷筛选整套替换、无效参数逐条报出来。小程序这边只负责渲染与取值。
 *
 * 小程序没有地址栏，所以组件吐出的是参数记录（change 事件的 params），
 * 页面自己决定是塞进 wx.navigateTo 的 query 还是存进本地——这正是契约里
 * 不出现 URL 的原因。
 */
import {
  activeCount,
  applyQuickFilter,
  changeFilter,
  clearFilters,
  matchQuickFilter,
  serializeQuery
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    fields: { type: Array, value: [] },
    /** { values, page, pageSize } */
    value: { type: Object, value: null },
    quickFilters: { type: Array, value: [] },
    invalid: { type: Array, value: [] },
    collapsedCount: { type: Number, value: 3 },
    collapsed: { type: Boolean, value: true }
  },
  data: { folded: true, shownFields: [], hiddenCount: 0, active: 0, quickState: [] },
  observers: {
    'fields, value, quickFilters, collapsed, collapsedCount': function () {
      this.setData({ folded: this.data.collapsed }, () => this.refresh())
    }
  },
  lifetimes: {
    attached() {
      this.setData({ folded: this.properties.collapsed }, () => this.refresh())
    }
  },
  methods: {
    state() {
      return this.data.value || { values: {}, page: 1, pageSize: 20 }
    },

    refresh() {
      const fields = this.data.fields || []
      const state = this.state()
      // 标了 always 的字段折叠后仍然留在原位：收光之后每次都要先展开再筛，
      // 折叠反而变成了多一步
      const always = fields.filter((f) => f.always)
      const rest = fields.filter((f) => !f.always)
      const shown = this.data.folded
        ? always.concat(rest.slice(0, this.data.collapsedCount))
        : fields
      this.setData({
        shownFields: shown.map((f) => this.decorate(f, state)),
        hiddenCount: fields.length - shown.length,
        active: activeCount(state.values || {}),
        quickState: (this.data.quickFilters || []).map((q) => ({
          key: q.key,
          label: q.label,
          on: matchQuickFilter(state.values || {}, q)
        }))
      })
    },

    /** 把取值摊平到模板能直接读的字段：wxml 里没法做类型分支 */
    decorate(field, state) {
      const raw = (state.values || {})[field.name]
      const range = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
      return Object.assign({}, field, {
        text: typeof raw === 'string' ? raw : '',
        list: Array.isArray(raw) ? raw : [],
        from: range.from || '',
        to: range.to || '',
        tagOptions: (field.options || []).map((o) => ({
          value: o.value,
          label: o.label,
          on: Array.isArray(raw) && raw.indexOf(o.value) >= 0
        })),
        isText: field.kind === 'text',
        isSelect: field.kind === 'select',
        isMulti: field.kind === 'multi-select',
        isRange: field.kind === 'date-range' || field.kind === 'number-range',
        inputType: field.kind === 'number-range' ? 'digit' : 'text'
      })
    },

    push(next) {
      this.triggerEvent('change', {
        state: next,
        params: serializeQuery(next, this.data.fields || [])
      })
    },

    onText(e) {
      this.push(changeFilter(this.state(), e.currentTarget.dataset.name, e.detail.value))
    },

    onSelect(e) {
      const { name, value } = e.currentTarget.dataset
      this.push(changeFilter(this.state(), name, value))
    },

    onToggleTag(e) {
      const { name, value } = e.currentTarget.dataset
      const current = this.state().values[name]
      const list = Array.isArray(current) ? current : []
      const next = list.indexOf(value) >= 0 ? list.filter((v) => v !== value) : list.concat([value])
      this.push(changeFilter(this.state(), name, next))
    },

    onRange(e) {
      const { name, part } = e.currentTarget.dataset
      const state = this.state()
      const current = state.values[name]
      const range = current && typeof current === 'object' && !Array.isArray(current) ? current : {}
      const next = Object.assign({}, range)
      next[part] = e.detail.value || undefined
      this.push(changeFilter(state, name, next))
    },

    onQuick(e) {
      const quick = (this.data.quickFilters || []).find((q) => q.key === e.currentTarget.dataset.key)
      if (quick) this.push(applyQuickFilter(this.state(), quick))
    },

    onClear() {
      this.push(clearFilters(this.state()))
    },

    onFold() {
      this.setData({ folded: !this.data.folded }, () => this.refresh())
    }
  }
})
