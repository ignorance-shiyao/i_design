/**
 * ApprovalCard —— 智能体行动前征求确认。
 * 「能否继续」的判断走共享的 canAdvance：填了自由输入也算已回答，
 * 否则用户写完「其他」却发现继续按钮仍是灰的。
 */
import { approvalProgress, canAdvance, toggleApprovalValue } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    questions: { type: Array, value: [] },
    confirmText: { type: String, value: '继续' },
    skipText: { type: String, value: '跳过' },
    closable: { type: Boolean, value: true }
  },
  data: { index: 0, selected: [], custom: '', current: null, progress: '', advanceable: false, isLast: false, options: [] },
  observers: {
    'questions, index, selected, custom': function () { this.refresh() }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const { questions, index, selected, custom } = this.data
      const current = questions[index]
      if (!current) return
      this.setData({
        current,
        progress: approvalProgress(index, questions.length),
        advanceable: canAdvance(current, selected, custom),
        isLast: index === questions.length - 1,
        // 选中态在这里算好：WXML 里没有 includes
        options: current.options.map((o) => ({ ...o, on: selected.indexOf(o.value) !== -1 }))
      })
    },
    onPick(e) {
      const value = e.currentTarget.dataset.value
      this.setData({ selected: toggleApprovalValue(this.data.current, this.data.selected, value) })
    },
    onCustom(e) { this.setData({ custom: e.detail.value }) },
    onNext() {
      if (!this.data.advanceable) return
      this.commit({ values: this.data.selected.slice(), custom: this.data.custom.trim() || undefined })
    },
    onSkip() { this.commit({ skipped: true }) },
    onPrev() { if (this.data.index > 0) this.setData({ index: this.data.index - 1, selected: [], custom: '' }) },
    onClose() { this.triggerEvent('close') },
    commit(answer) {
      this.answers = { ...(this.answers || {}), [this.data.current.id]: answer }
      if (this.data.isLast) this.triggerEvent('complete', { answers: this.answers })
      else this.setData({ index: this.data.index + 1, selected: [], custom: '' })
    }
  }
})
