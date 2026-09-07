Component({
  options: { addGlobalClass: true },
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '' },
    actions: { type: Array, value: [] },
    cancelText: { type: String, value: '取消' }
  },
  methods: {
    onClose() { this.triggerEvent('close') },
    onPick(e) {
      const { index, disabled } = e.currentTarget.dataset
      if (disabled) return
      this.triggerEvent('select', { index, action: this.data.actions[index] })
      this.triggerEvent('close')
    },
    noop() {}
  }
})
