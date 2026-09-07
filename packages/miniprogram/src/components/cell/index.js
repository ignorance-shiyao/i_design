Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    value: { type: String, value: '' },
    clickable: { type: Boolean, value: false }
  },
  methods: {
    onTap() { if (this.data.clickable) this.triggerEvent('click') }
  }
})
