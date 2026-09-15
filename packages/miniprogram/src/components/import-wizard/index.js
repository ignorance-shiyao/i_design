/**
 * ImportWizard —— 导入向导的列映射与预检报告（astra.md 的 B11）。
 *
 * 文件怎么读、预检怎么跑、导入怎么发，都在页面手里——这个组件不碰任何 IO。
 * 映射表按「一行一个目标字段」排：用户心里的问题是「我这张表里哪一列是客户」。
 *
 * 判断走 logic/importjob.ts，五端共用一份。
 */
import {
  assignMapping,
  canProceed,
  mappingIssues,
  problemsCsv
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** 文件表头。由页面解析出来 */
    sources: { type: Array, value: [] },
    /** 要导入到哪些字段 */
    fields: { type: Array, value: [] },
    /** 目标字段 → 来源列。受控：映射是数据，不是向导的内部状态 */
    mapping: { type: Object, value: {} },
    /** 预检报告。null 表示还没跑过 */
    report: { type: null, value: null },
    busy: { type: Boolean, value: false },
    maxProblems: { type: Number, value: 8 }
  },
  data: {
    rows: [], issues: [], ready: false, pickerRange: [],
    problems: [], hiddenProblems: 0, reportIcon: 'check-circle'
  },
  observers: {
    'sources, fields, mapping, report, maxProblems': function () { this.refresh() }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const { sources, fields, mapping, report, maxProblems } = this.data
      const issues = mappingIssues(mapping, fields)
      // 小程序的 picker 只吃「一个字符串数组 + 一个下标」，所以这里先摊平
      const range = ['（不映射）', ...sources.map((s) => s.key)]
      this.setData({
        rows: fields.map((f) => {
          const source = mapping[f.key] || ''
          return {
            ...f,
            source,
            index: source ? range.indexOf(source) : 0,
            sample: (sources.find((s) => s.key === source) || {}).sample || ''
          }
        }),
        issues,
        ready: canProceed(issues),
        pickerRange: range,
        problems: report ? report.problems.slice(0, maxProblems) : [],
        hiddenProblems: report ? Math.max(0, report.problems.length - maxProblems) : 0,
        reportIcon: report && report.problems.length ? 'warning-triangle' : 'check-circle'
      })
    },
    onPick(e) {
      const field = e.currentTarget.dataset.field
      const picked = this.data.pickerRange[Number(e.detail.value)]
      // 指给别人之前先从原处摘掉，否则会悄悄变成「一列映给两个字段」
      const next = assignMapping(this.data.mapping, field, Number(e.detail.value) === 0 ? null : picked)
      this.triggerEvent('mappingchange', { mapping: next })
    },
    onDryRun() { if (this.data.ready && !this.data.busy) this.triggerEvent('dryrun') },
    onSubmit() {
      if (this.data.ready && !this.data.busy && this.data.report) this.triggerEvent('submit')
    },
    onDownload() {
      const { report } = this.data
      if (report) this.triggerEvent('download', { csv: problemsCsv(report.problems) })
    }
  }
})
