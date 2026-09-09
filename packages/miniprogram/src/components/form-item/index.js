/**
 * FormItem —— 标签、控件与提示三段。
 *
 * error 有值即视为校验失败并覆盖 help 显示：两条文字同时出现时，
 * 用户不知道该信哪一条。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    label: { type: String, value: '' },
    required: { type: Boolean, value: false },
    error: { type: String, value: '' },
    help: { type: String, value: '' },
    layout: { type: String, value: 'vertical' },
    labelWidth: { type: String, value: '88px' }
  }
})
