Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    count: { type: Number, value: 0 },
    max: { type: Number, value: 99 },
    dot: { type: Boolean, value: false },
    showZero: { type: Boolean, value: false },
    type: { type: String, value: 'danger' },
    /** 包裹内容时作为角标定位；小程序无法探测插槽是否为空，改由属性声明 */
    fixed: { type: Boolean, value: true }
  },
  data: { visible: false, text: '' },
  observers: {
    'count, max, dot, showZero': function (count, max, dot, showZero) {
      this.setData({
        visible: dot || count > 0 || (count === 0 && showZero),
        text: count > max ? `${max}+` : String(count)
      })
    }
  }
})
