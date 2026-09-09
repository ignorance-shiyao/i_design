/**
 * Pagination —— 页码序列、边界收敛与区间文案全部来自公共层，
 * 与 Web 端是同一份实现，因此小程序里的分页不会「少一个省略号」。
 */
import { buildPages, clampPage, pageCountOf, rangeText } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    current: { type: Number, value: 1 },
    total: { type: Number, value: 0 },
    pageSize: { type: Number, value: 10 },
    maxVisible: { type: Number, value: 5 },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
    showTotal: { type: Boolean, value: true }
  },
  data: { items: [], page: 1, pageCount: 1, rangeText: '' },
  observers: {
    'current, total, pageSize, maxVisible': function (current, total, pageSize, maxVisible) {
      const pageCount = pageCountOf(total, pageSize)
      const page = clampPage(current, pageCount)
      this.setData({
        page,
        pageCount,
        rangeText: rangeText(page, pageSize, total),
        // WXML 无法直接判断联合类型，转成 { type, value } 结构
        items: buildPages(page, pageCount, maxVisible).map((item) =>
          typeof item === 'number' ? { type: 'page', value: item } : { type: item }
        )
      })
    }
  },
  methods: {
    go(next) {
      if (this.data.disabled) return
      const target = clampPage(next, this.data.pageCount)
      if (target !== this.data.page) this.triggerEvent('change', { page: target })
    },
    onPrev() { this.go(this.data.page - 1) },
    onNext() { this.go(this.data.page + 1) },
    onPage(e) { this.go(e.currentTarget.dataset.page) },
    onJump(e) {
      const step = this.data.maxVisible
      this.go(this.data.page + (e.currentTarget.dataset.dir === 'left' ? -step : step))
    }
  }
})
