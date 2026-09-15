/**
 * ModalForm —— 弹窗里的表单壳（astra.md 的 B09）。
 *
 * 与 FormPage 是同一套判断（logic/formhost.ts），换了个容器。浮层多出来的
 * 那件事是：关闭这个动作本身要被离开保护拦住——点遮罩、点右上角的叉，
 * 在改了一半的表单上都等于「放弃刚才填的东西」。
 */
import { leaveGuard, resetLabel, resetValues, submitGate } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '' },
    width: { type: String, value: '80%' },
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
  data: { allowed: false, busy: false, status: '', blocked: false, asking: false, guardBlocked: false, guardMessage: '', resetText: '撤销修改' },
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
        guardBlocked: guard.blocked,
        guardMessage: guard.message,
        // 表单一改动，之前那次「确定要走吗」就不作数了
        asking: false,
        resetText: resetLabel(resetScope, draft !== null)
      })
    },
    /** 浮层的关闭（遮罩、右上角的叉）与「取消」都走这里，先问一句再关 */
    onRequestClose() {
      if (this.data.guardBlocked) {
        this.setData({ asking: true })
        return
      }
      this.onLeave()
    },
    onKeepEditing() { this.setData({ asking: false }) },
    onLeave() {
      this.setData({ asking: false })
      this.triggerEvent('visiblechange', { visible: false })
      this.triggerEvent('cancel')
    },
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
