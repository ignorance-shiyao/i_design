Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: Array, value: [] },
    items: { type: Array, value: [] },
    accordion: { type: Boolean, value: false },
    bordered: { type: Boolean, value: true }
  },
  data: { states: [] },
  observers: {
    'value, items': function (value, items) {
      this.setData({ states: items.map((item) => ({ ...item, open: value.includes(item.name) })) })
    }
  },
  methods: {
    onToggle(e) {
      const { name, disabled } = e.currentTarget.dataset
      if (disabled) return
      const open = this.data.value.includes(name)
      const next = this.data.accordion
        ? open ? [] : [name]
        : open ? this.data.value.filter((n) => n !== name) : [...this.data.value, name]
      this.triggerEvent('change', { value: next })
    }
  }
})
