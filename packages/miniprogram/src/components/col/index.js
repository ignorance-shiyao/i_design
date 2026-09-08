/** Col —— 24 栅格中的一列 */
Component({
  options: { addGlobalClass: true },
  properties: {
    span: { type: Number, value: 24 },
    offset: { type: Number, value: 0 },
    // 小程序运行在手机上，默认整栏铺满；确需并排时传 keep
    sm: { type: Number, value: 24 },
    keep: { type: Boolean, value: false },
    flex: { type: Boolean, value: false }
  }
})
