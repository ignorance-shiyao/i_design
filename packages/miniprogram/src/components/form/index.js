/**
 * Form —— 只负责布局与标签宽度。
 *
 * 校验交给调用方在 form-item 上传 error：小程序没有 provide/inject，
 * 在这里造一套跨组件的校验总线，调试成本远高于它省下的几行代码。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    layout: { type: String, value: 'vertical' },
    labelWidth: { type: String, value: '88px' }
  }
})
