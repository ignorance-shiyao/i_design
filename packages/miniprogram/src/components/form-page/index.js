/**
 * FormPage —— 整页表单的壳（astra.md 的 B09）。
 *
 * 它不管字段怎么渲染，管的是围着表单的那几件事：重复提交拦不拦、
 * 现在为什么不能提交、改了几项没保存、点「取消」要不要先问一句。
 * 判断走 logic/formhost.ts，五端共用一份。
 */
import { leaveGuard, resetLabel, resetValues, submitGate } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    /** 当前表单值。受控：壳不自己存 */
    values: { type: Object, value: {} },
    /** 打开这张表时的样子。编辑态下就是原始数据，新建态是空对象 */
    initial: { type: Object, value: {} },
    /** 上次存下的草稿。null 表示没有草稿 */
    draft: { type: null, value: null },
    phase: { type: String, value: 'idle' },
    valid: { type: Boolean, value: true },
    disabled: { type: Boolean, value: false },
    resubmittable: { type: Boolean, value: false },
    resetScope: { type: String, value: 'initial' },
    submitText: { type: String, value: '提交' },
    cancelText: { type: String, value: '取消' },
    resettable: { type: Boolean, value: true }
  },
  data: { allowed: false, busy: false, status: '', blocked: false, asking: false, guardMessage: '', resetText: '撤销修改' },
  observers: {
    'values, initial, draft, phase, valid, disabled, resubmittable, resetScope': function () {
      this.refresh()
    }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const { values, initial, draft, phase, valid, disabled, resubmittable, resetScope } = this.data
      const gate = submitGate({ phase, valid, disabled, resubmittable })
      const guard = leaveGuard({ base: initial, current: values, phase, draftSaved: draft !== null })
      this.setData({
        allowed: gate.allowed,
        busy: gate.busy,
        blocked: !!gate.reason,
        /*
         * 优先说「为什么不能提交」，没话说才说「有几项没保存」。
         * 反过来的话，正在提交时显示的是「有 3 项未保存」，读起来像是没交上去。
         */
        status: gate.reason || (guard.blocked ? guard.message.replace('，确定离开吗？', '') : ''),
        guardMessage: guard.message,
        guardBlocked: guard.blocked,
        /*
         * 表单一改动，之前那次「确定要走吗」就不作数了；正在提交时 leaveGuard
         * 本来就不拦，message 是空的，确认条留在屏幕上就成了一条没有问题的确认。
         */
        asking: false,
        resetText: resetLabel(resetScope, draft !== null)
      })
    },
    onCancel() {
      if (this.data.guardBlocked) {
        this.setData({ asking: true })
        return
      }
      this.triggerEvent('cancel')
    },
    onKeepEditing() { this.setData({ asking: false }) },
    onLeave() { this.triggerEvent('cancel') },
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
