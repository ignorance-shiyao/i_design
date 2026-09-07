Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '' },
    items: { type: Array, value: [] },
    variant: { type: String, value: 'line' },
    size: { type: String, value: 'md' }
  },
  methods: {
    onSelect(e) {
      const { name, disabled } = e.currentTarget.dataset
      if (disabled || name === this.data.value) return
      this.triggerEvent('change', { value: name })
    }
  }
})
