/**
 * AutoComplete —— 自动完成。
 *
 * 过滤、排序与命中切段全部走公共层：各端自己写一遍 indexOf 高亮，
 * 大小写不一致时会错位，而且拼字符串就得处理转义。
 */
import { filterSuggestions, matchParts, moveActive } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '' },
    options: { type: Array, value: [] },
    placeholder: { type: String, value: '' },
    /** 最多列出几条。列太多不如让用户再敲一个字 */
    limit: { type: Number, value: 8 },
    disabled: { type: Boolean, value: false }
  },
  data: { open: false, active: -1, matches: [] },
  observers: {
    'value, options, limit': function () { this.refresh() }
  },
  methods: {
    refresh() {
      const matches = filterSuggestions(this.data.options, this.data.value, this.data.limit)
      this.setData({
        matches: matches.map((m) => ({
          ...m,
          parts: matchParts(m.label || m.value, this.data.value)
        }))
      })
    },

    onInput(e) {
      const value = e.detail.value
      // 每次改动都把高亮清掉：留着上一次的高亮，确认会选中一个与当前输入无关的项
      this.setData({ value, active: -1, open: true })
      this.triggerEvent('change', { value })
      this.refresh()
    },

    move(step) {
      const active = moveActive(
        this.data.matches.map((m) => ({ value: m.value, disabled: m.disabled })),
        this.data.active,
        step
      )
      this.setData({ active })
    },

    onChoose(e) {
      const item = this.data.matches[Number(e.currentTarget.dataset.index)]
      if (!item || item.disabled) return
      this.setData({ value: item.value, open: false, active: -1 })
      this.triggerEvent('change', { value: item.value })
      this.triggerEvent('select', { item })
      this.refresh()
    },

    onFocus() { this.setData({ open: true }) },
    /* 延后收起：不延后的话，点候选时 blur 先到，面板已经没了，点击落空 */
    onBlur() {
      setTimeout(() => this.setData({ open: false }), 120)
    }
  }
})
