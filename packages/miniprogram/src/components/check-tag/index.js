Component({
  options: { addGlobalClass: true },
  properties: {
    checked: { type: Boolean, value: false },
    round: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    text: { type: String, value: '' }
  },
  methods: {
    onTap() {
      if (this.data.disabled) return
      const checked = !this.data.checked
      this.setData({ checked })
      this.triggerEvent('change', { checked })
    }
  }
})
