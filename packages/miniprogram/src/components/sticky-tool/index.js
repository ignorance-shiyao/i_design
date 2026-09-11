Component({
  options: { addGlobalClass: true },
  properties: {
    /** [{ value, label, icon, disabled }] */
    items: { type: Array, value: [] },
    placement: { type: String, value: 'right' },
    /** 当前高亮项 */
    active: { type: String, value: '' }
  },
  methods: {
    onTap(event) {
      const item = event.currentTarget.dataset.item
      if (!item || item.disabled) return
      this.triggerEvent('click', { item })
    }
  }
})
