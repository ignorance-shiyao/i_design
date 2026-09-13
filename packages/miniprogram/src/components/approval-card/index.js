/**
 * ApprovalCard —— 智能体行动前征求确认。
 * 「能否继续」的判断走共享的 canAdvance：填了自由输入也算已回答，
 * 否则用户写完「其他」却发现继续按钮仍是灰的。
 */
import { getLocale } from '../../config'

import { approvalProgress, canAdvance, toggleApprovalValue } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    questions: { type: Array, value: [] },
    confirmText: { type: String, value: '' },
    skipText: { type: String, value: '' },
    closable: { type: Boolean, value: true }
  },
  data: { index: 0, selected: [], custom: '', current: null, progress: '', advanceable: false, isLast: false, options: [], confirmLabel: '', skipLabel: '', nextLabel: '', otherLabel: '' },
  observers: {
    'questions, index, selected, custom': function () { this.refresh() }
  },
  lifetimes: { attached() {
      this.syncLocale()
      this.refresh() } },
  methods: {
    /* 「继续」「跳过」「下一题」「其他」都走字典；组件自己传了以传进来的为准 */
    syncLocale() {
      const locale = getLocale()
      this.setData({
        confirmLabel: this.data.confirmText || locale.confirm,
        skipLabel: this.data.skipText || locale.skip,
        nextLabel: locale.next,
        otherLabel: locale.otherOption,
      })
    },
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
