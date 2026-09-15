/**
 * StepForm —— 分步表单的壳（astra.md 的 B09）。
 *
 * 值由调用方持有，这个壳一个字都不存，所以返回上一步天然不丢数据；
 * 能不能往下走只看这一步自己的字段；提交失败跳回出错的那一步。
 * 判断走 logic/formhost.ts，五端共用一份。
 *
 * 小程序没有动态具名插槽，所以这里只出一个 slot：当前是哪一步由
 * stepchange 事件告诉页面，页面自己决定这一屏渲染什么。
 */
import { resetLabel, resetValues, stepOfError, stepState, submitGate } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    steps: { type: Array, value: [] },
    /** 当前表单值。受控：壳不自己存 */
    values: { type: Object, value: {} },
    initial: { type: Object, value: {} },
    draft: { type: null, value: null },
    /** 当前所有字段的错误路径 */
    errorPaths: { type: Array, value: [] },
    phase: { type: String, value: 'idle' },
    disabled: { type: Boolean, value: false },
    resubmittable: { type: Boolean, value: false },
    resetScope: { type: String, value: 'initial' },
    submitText: { type: String, value: '提交' },
    resettable: { type: Boolean, value: true }
  },
  data: {
    index: 0,
    /** 走过哪些步。没走到过的不标红——那说的是「还没填」，不是「填错了」 */
    visited: [0],
    marks: [], canPrev: false, canNext: false, isLast: false,
    allowed: false, busy: false, status: '', resetText: '撤销修改'
  },
  observers: {
    'steps, errorPaths, phase, disabled, resubmittable, resetScope, draft': function () {
      this.refresh()
    }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const { steps, index, errorPaths, visited, phase, disabled, resubmittable, resetScope, draft } = this.data
      const state = stepState({ steps, index, errorPaths, visited })
      const gate = submitGate({
        phase,
        // 最后一步的提交要求整张表没有错，不只是这一步
        valid: errorPaths.length === 0,
        disabled,
        resubmittable
      })
      this.setData({
        // 序号在这里算好：WXML 里没法在模板中做加法之外的事，序号与状态一起给更省心
        marks: state.marks.map((m, i) => ({ ...m, no: i + 1 })),
        canPrev: state.canPrev,
        canNext: state.canNext,
        isLast: state.isLast,
        allowed: gate.allowed,
        busy: gate.busy,
        status: state.blocked
          ? '这一步还有字段没填对'
          : gate.reason && state.isLast
            ? gate.reason
            : '',
        resetText: resetLabel(resetScope, draft !== null)
      })
      /*
       * 提交失败之后跳回出错的那一步。只在 failed 那一刻跳一次：
       * 每次错误变化都跳的话，用户在第一步改字时会被第三步的错误拽走。
       */
      if (phase === 'failed' && this.lastPhase !== 'failed') {
        const target = stepOfError(steps, errorPaths)
        if (target >= 0 && target !== index) this.go(target)
      }
      this.lastPhase = phase
    },
    go(next) {
      const { steps, visited } = this.data
      if (next < 0 || next >= steps.length) return
      this.setData({
        index: next,
        visited: visited.indexOf(next) === -1 ? visited.concat(next) : visited
      })
      this.refresh()
      this.triggerEvent('stepchange', { index: next, key: steps[next] ? steps[next].key : '' })
    },
    onPrev() { this.go(this.data.index - 1) },
    onNext() { if (this.data.canNext) this.go(this.data.index + 1) },
    onReset() {
      const { resetScope, initial, draft } = this.data
      const next = resetValues(resetScope, initial, draft || undefined)
      this.triggerEvent('valueschange', { values: next })
      this.triggerEvent('reset', { values: next })
    },
    onSubmit() {
      if (!this.data.allowed) return
      this.triggerEvent('submit', { values: this.data.values })
    }
  }
})
