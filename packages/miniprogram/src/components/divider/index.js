Component({
  options: { addGlobalClass: true },
  properties: {
    direction: { type: String, value: 'horizontal' },
    align: { type: String, value: 'center' },
    dashed: { type: Boolean, value: false },
    /** 小程序的插槽无法参与 has-text 判断，文案改为属性传入 */
    text: { type: String, value: '' }
  }
})
