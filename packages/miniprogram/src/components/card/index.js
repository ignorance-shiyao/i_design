Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    hoverable: { type: Boolean, value: false },
    bordered: { type: Boolean, value: true },
    /** 小程序无法探测具名插槽是否有内容，由使用方显式声明 */
    hasFooter: { type: Boolean, value: false }
  }
})
