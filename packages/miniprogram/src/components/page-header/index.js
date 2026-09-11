Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    backText: { type: String, value: '返回' },
    back: { type: Boolean, value: true }
  },
  methods: {
    onBack() {
      this.triggerEvent('back')
    }
  }
})
