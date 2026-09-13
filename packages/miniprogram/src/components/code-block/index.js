/**
 * CodeBlock —— 代码块。
 *
 * 高亮、行号与统一 diff 视图。切分与比对都走公共层：同一段补丁在小程序上
 * 显示改了 3 行、在 Web 上显示改了 5 行的话，读者不知道该信哪个。
 *
 * 这一端必须在 JS 里把行与 token 都算好交给模板：WXML 不能调用函数，
 * 也没有 v-html 这类东西——反过来说，注入那条路在这里根本不存在。
 */
import { diffLines, diffStat, tokenizeLines } from '@i-design/common'
import { getLocale } from '../../config'

Component({
  options: { addGlobalClass: true },
  properties: {
    code: { type: String, value: '' },
    lang: { type: String, value: '' },
    filename: { type: String, value: '' },
    lineNumbers: { type: Boolean, value: true },
    copyable: { type: Boolean, value: true },
    /** 改动前的内容；给了就切成统一 diff 视图 */
    before: { type: String, value: '' }
  },
  data: { rows: [], isDiff: false, added: 0, removed: 0, label: '', copyText: '' },
  lifetimes: {
    attached() {
      this.syncLocale()
      this.build()
    }
  },
  observers: {
    'code, lang, before': function () {
      this.build()
    }
  },
  methods: {
    syncLocale() {
      this.setData({ copyText: getLocale().copy })
    },

    trim(text) {
      return String(text || '').replace(/^\n+|\s+$/g, '')
    },

    build() {
      const source = this.trim(this.data.code)
      const before = this.trim(this.data.before)
      const isDiff = this.data.before !== ''

      const rows = isDiff
        ? diffLines(before, source).map((line, index) => ({
            key: index,
            kind: line.kind,
            sign: line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' ',
            before: line.before || '',
            after: line.after || '',
            tokens: tokenizeLines(line.text, this.data.lang)[0] || []
          }))
        : tokenizeLines(source, this.data.lang).map((tokens, index) => ({
            key: index,
            kind: 'same',
            sign: '',
            before: index + 1,
            after: '',
            tokens
          }))

      const stat = isDiff ? diffStat(diffLines(before, source)) : { added: 0, removed: 0 }
      this.setData({
        rows,
        isDiff,
        added: stat.added,
        removed: stat.removed,
        label: this.data.filename || this.data.lang || 'text'
      })
    },

    copy() {
      wx.setClipboardData({ data: this.trim(this.data.code) })
      this.triggerEvent('copy')
    }
  }
})
