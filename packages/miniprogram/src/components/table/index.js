/**
 * Table —— 小程序没有可用的 <table> 布局，改用 flex 行列模拟；
 * 但排序规则（三态循环与比较）来自公共层，与 Web 端逐字相同。
 */
import { nextSortOrder, rafThrottle, shouldVirtualize, sortRows, virtualWindow } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    columns: { type: Array, value: [] },
    data: { type: Array, value: [] },
    rowKey: { type: String, value: 'id' },
    size: { type: String, value: 'md' },
    striped: { type: Boolean, value: false },
    loading: { type: Boolean, value: false },
    emptyText: { type: String, value: '暂无数据' },
    /**
     * 表体高度（px）。给了才能虚拟化——没有可视高度就算不出该渲染哪几行。
     * 不给时整张表平铺，由页面滚动。
     */
    height: { type: Number, value: 0 },
    /** 量不到行高时的兜底值（px） */
    rowHeight: { type: Number, value: 44 }
  },
  data: {
    rows: [],
    visible: [],
    total: 0,
    virtual: false,
    paddingTop: 0,
    paddingBottom: 0,
    measuredRow: 44,
    scrollTop: 0,
    sortKey: null,
    sortOrder: null
  },
  lifetimes: {
    attached() {
      this.setData({ measuredRow: this.data.rowHeight })
    },
    detached() {
      if (this.scrollHandler) this.scrollHandler.cancel()
    }
  },
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
      this.allRows = sorted.map((r, i) => ({ ...r, _key: String(r[rowKey] ?? i) }))
      this.setData({ total: this.allRows.length }, () => {
        this.window()
        this.measure()
      })
    },

    /**
     * 只渲染看得见的那几行。窗口计算与 Web 端共用 logic/virtual，
     * 因此两端在同一个滚动位置露出的是同一批行。
     */
    window() {
      const all = this.allRows || []
      const { height, scrollTop, measuredRow } = this.data
      if (!height || !shouldVirtualize(all.length)) {
        this.setData({ virtual: false, rows: all, visible: all })
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
      query.select('.i-table-c__row').boundingClientRect()
      query.exec((res) => {
        const rect = res && res[0]
        if (rect && rect.height > 0 && rect.height !== this.data.measuredRow) {
          this.setData({ measuredRow: rect.height }, () => this.window())
        }
      })
    },

    onScroll(event) {
      /* 滚动事件远多于帧，而每次都要重算一遍窗口并 setData */
      if (!this.scrollHandler) {
        this.scrollHandler = rafThrottle((top) => {
          this.setData({ scrollTop: top }, () => this.window())
        })
      }
      this.scrollHandler(event.detail.scrollTop)
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
