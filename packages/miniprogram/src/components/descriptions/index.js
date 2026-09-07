Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    items: { type: Array, value: [] },
    title: { type: String, value: '' },
    column: { type: Number, value: 2 },
    layout: { type: String, value: 'horizontal' },
    bordered: { type: Boolean, value: true },
    size: { type: String, value: 'md' }
  }
})
