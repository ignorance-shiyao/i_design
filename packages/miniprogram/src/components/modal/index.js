/**
 * Modal —— 小程序没有 Teleport，浮层直接以 position: fixed 覆盖页面即可；
 * 但必须 catchtouchmove 阻断背景滚动，否则手指会带着后面的列表一起动。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '' },
    width: { type: String, value: '80%' },
    maskClosable: { type: Boolean, value: true },
    closable: { type: Boolean, value: true },
    hasFooter: { type: Boolean, value: false }
  },
  methods: {
    onClose() { this.triggerEvent('close') },
    onMask() { if (this.data.maskClosable) this.triggerEvent('close') },
    noop() {}
  }
})
