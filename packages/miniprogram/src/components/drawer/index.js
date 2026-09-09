Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '' },
    placement: { type: String, value: 'right' },
    size: { type: String, value: '75%' },
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
