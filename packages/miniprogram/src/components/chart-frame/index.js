/**
 * ChartFrame —— 小程序实现。
 *
 * 表格与图同源：都从 @i-design/common 的 toTable 出来。
 * 小程序端没有「下载文件」这回事，所以出口是复制 CSV 到剪贴板——
 * 用户还是能把数拿走，只是换了个通道。
 */
import { chartSummary, dataIssues, issueText, toCsv, toTable } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    title: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    note: { type: String, value: '' },
    dataset: { type: Object, value: null },
    spec: { type: Object, value: null },
    loading: { type: Boolean, value: false }
  },
  data: { header: [], rows: [], issues: [], summary: '', showTable: false },
  observers: {
    'dataset, spec': function (dataset, spec) {
      if (!dataset || !spec) {
        this.setData({ header: [], rows: [], issues: [], summary: '' })
        return
      }
      const table = toTable(dataset, spec)
      this.setData({
        header: table.header,
        // null 在模板里显示成「—」：写成 0 就等于在表格里也撒谎
        rows: table.rows.map((row) => row.map((cell) => (cell === null ? '—' : cell))),
        issues: dataIssues(dataset, spec).map(issueText),
        summary: chartSummary(dataset, spec)
      })
    }
  },
  methods: {
    toggle() {
      this.setData({ showTable: !this.data.showTable })
    },
    copyCsv() {
      const { dataset, spec } = this.data
      if (!dataset || !spec) return
      wx.setClipboardData({ data: toCsv(toTable(dataset, spec)) })
    }
  }
})
