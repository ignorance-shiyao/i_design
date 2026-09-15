/**
 * EntityPicker —— 人员 / 组织 / 资源的选择器（astra.md 的 B10）。
 *
 * 检索本身交给页面：谁去请求、请求哪个接口、怎么分页，都不是这个组件该管的。
 * 它管的是那三件一做错就出真问题的事：翻页之后已选还看不看得见、
 * 不能选的为什么不能、停用的怎么办。判断走 logic/entitypicker.ts。
 */
import {
  offPageChosen,
  pickerHint,
  pickerRows,
  pickerSummary,
  removePick,
  togglePick
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** 当前这一页的检索结果。由页面去请求 */
    page: { type: Array, value: [] },
    /** 已选。完整对象，不是 id——回显不能依赖它还在当前页里 */
    chosen: { type: Array, value: [] },
    keyword: { type: String, value: '' },
    loading: { type: Boolean, value: false },
    multiple: { type: Boolean, value: false },
    /** 最多选几个。0 表示不限 */
    max: { type: Number, value: 0 },
    unit: { type: String, value: '项' },
    placeholder: { type: String, value: '搜索姓名、工号或部门' }
  },
  data: { rows: [], summaryText: '', notice: '', offPageCount: 0, hint: '', fallbackIcon: 'user' },
  observers: {
    'page, chosen, keyword, loading, multiple, max, unit': function () {
      this.refresh()
    }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    input() {
      const { page, chosen, multiple, max } = this.data
      return { page, chosen, multiple, max: max || undefined }
    },
    refresh() {
      const { page, chosen, keyword, loading, multiple, max, unit } = this.data
      const summary = pickerSummary(chosen, max || undefined, unit)
      this.setData({
        rows: pickerRows(this.input()).map((r) => ({
          ...r,
          // 图标在这里算好：WXML 里没法写三目套三目还保持可读
          icon: r.selected ? 'check-circle' : multiple ? 'plus' : 'user'
        })),
        summaryText: summary.text,
        notice: summary.notice,
        offPageCount: offPageChosen(chosen, page).length,
        hint: pickerHint(keyword, loading, page.length)
      })
    },
    onKeyword(e) { this.triggerEvent('keywordchange', { keyword: e.detail.value }) },
    onPick(e) {
      const id = e.currentTarget.dataset.id
      const row = this.data.rows.find((r) => r.id === id)
      if (!row || row.disabled) return
      this.triggerEvent('change', { chosen: togglePick(this.input(), id) })
    },
    onRemove(e) {
      this.triggerEvent('change', {
        chosen: removePick(this.data.chosen, e.currentTarget.dataset.id)
      })
    }
  }
})
