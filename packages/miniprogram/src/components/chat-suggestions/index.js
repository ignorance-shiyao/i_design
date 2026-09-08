/** ChatSuggestions —— 追问建议，放在回答之后 */
Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    title: { type: String, value: '你可以接着问' }
  },
  methods: {
    onSelect(e) { this.triggerEvent('select', { value: e.currentTarget.dataset.value }) }
  }
})
