/** List —— 逐条阅读的条目列表；与 Table 的分工同 Web 端 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    items: { type: Array, value: [] },
    plain: { type: Boolean, value: false },
    header: { type: String, value: '' },
    footer: { type: String, value: '' },
    clickable: { type: Boolean, value: false }
  },
  methods: {
    onSelect(e) {
      const index = e.currentTarget.dataset.index
      const item = this.data.items[index]
      if (!this.data.clickable || item.disabled) return
      this.triggerEvent('select', { item, index })
    }
  }
})
