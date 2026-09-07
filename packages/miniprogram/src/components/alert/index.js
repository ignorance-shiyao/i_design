Component({
  options: { addGlobalClass: true },
  properties: {
    type: { type: String, value: 'info' },
    title: { type: String, value: '' },
    closable: { type: Boolean, value: false }
  },
  methods: {
    onClose() {
      this.triggerEvent('close')
    }
  }
})
