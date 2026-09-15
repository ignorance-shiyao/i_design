/**
 * ApprovalCard —— 智能体行动前征求确认。
 * 「能否继续」的判断走共享的 canAdvance：填了自由输入也算已回答，
 * 否则用户写完「其他」却发现继续按钮仍是灰的。
 */
import { getLocale } from '../../config'

import {
  approvalGate,
  approvalProgress,
  canAdvance,
  elapsedInterval,
  toggleApprovalValue
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    questions: { type: Array, value: [] },
    /**
     * 过期时刻（毫秒时间戳）。0 表示这条确认不过期。
     *
     * 这张卡片会在屏幕上待很久——人切走看别的、锁了屏。回来时那个动作
     * 可能已经不该再执行了，而卡片长得和刚发出来时一模一样：按钮还亮着。
     */
    expiresAt: { type: Number, value: 0 },
    /** 这条确认是针对哪个版本发出的。0 表示不校验版本 */
    version: { type: Number, value: 0 },
    /** 被确认的东西现在是第几版。与 version 不同就说明前提变了 */
    currentVersion: { type: Number, value: 0 },
    confirmText: { type: String, value: '' },
    skipText: { type: String, value: '' },
    renewText: { type: String, value: '重新发起' },
    reviewText: { type: String, value: '查看新版本' },
    closable: { type: Boolean, value: true }
  },
  data: { index: 0, selected: [], custom: '', current: null, progress: '', advanceable: false, isLast: false, options: [], confirmLabel: '', skipLabel: '', nextLabel: '', otherLabel: '', gateState: 'open', gateLabel: '', gateDetail: '', gateAction: 'none', gateIcon: 'clock', decidable: true },
  observers: {
    'questions, index, selected, custom, expiresAt, version, currentVersion': function () { this.refresh() }
  },
  lifetimes: {
    attached() {
      this.syncLocale()
      this.refresh()
    },
    // 定时器必须跟着组件一起收：页面退了还在跳，等于每秒白跑一次 setData
    detached() {
      this.stopClock()
    }
  },
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
      const { questions, index, selected, custom, expiresAt, version, currentVersion } = this.data
      const current = questions[index]
      if (!current) return
      const now = Date.now()
      const gate = approvalGate({
        expiresAt: expiresAt || undefined,
        version: version || undefined,
        currentVersion: currentVersion || undefined,
        now
      })
      this.setData({
        current,
        progress: approvalProgress(index, questions.length),
        // 不能拍板时连「下一题」都停掉：翻到最后一题再发现按钮是灰的更让人恼火
        advanceable: gate.decidable && canAdvance(current, selected, custom),
        isLast: index === questions.length - 1,
        // 选中态在这里算好：WXML 里没有 includes
        options: current.options.map((o) => ({ ...o, on: selected.indexOf(o.value) !== -1 })),
        gateState: gate.state,
        gateLabel: gate.label,
        gateDetail: gate.detail,
        gateAction: gate.action,
        /* 两种失效用不同图标而不是只换颜色：等太久了是时钟，内容变了是版本记录 */
        gateIcon: gate.state === 'stale' ? 'history' : 'clock',
        decidable: gate.decidable
      })
      this.stopClock()
      // 只在还剩时间时走表：过期或版本失效之后再跳，除了耗电什么也不做
      if (gate.state === 'expiring') {
        this.timer = setTimeout(() => this.refresh(), elapsedInterval(now))
      }
    },
    stopClock() {
      if (this.timer) clearTimeout(this.timer)
      this.timer = null
    },
    onPick(e) {
      if (!this.data.decidable) return
      const value = e.currentTarget.dataset.value
      this.setData({ selected: toggleApprovalValue(this.data.current, this.data.selected, value) })
    },
    onRenew() { this.triggerEvent('renew') },
    onReview() { this.triggerEvent('review') },
    onCustom(e) { this.setData({ custom: e.detail.value }) },
    onNext() {
      if (!this.data.advanceable) return
      this.commit({ values: this.data.selected.slice(), custom: this.data.custom.trim() || undefined })
    },
    onSkip() { if (this.data.decidable) this.commit({ skipped: true }) },
    onPrev() { if (this.data.index > 0) this.setData({ index: this.data.index - 1, selected: [], custom: '' }) },
    onClose() { this.triggerEvent('close') },
    commit(answer) {
      this.answers = { ...(this.answers || {}), [this.data.current.id]: answer }
      if (this.data.isLast) this.triggerEvent('complete', { answers: this.answers })
      else this.setData({ index: this.data.index + 1, selected: [], custom: '' })
    }
  }
})
