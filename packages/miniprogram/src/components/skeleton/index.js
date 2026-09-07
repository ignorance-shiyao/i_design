Component({
  options: { addGlobalClass: true },
  properties: {
    loading: { type: Boolean, value: true },
    variant: { type: String, value: 'paragraph' },
    rows: { type: Number, value: 3 },
    animated: { type: Boolean, value: true }
  },
  data: { widths: [], rowList: [] },
  observers: {
    rows(rows) {
      // 末行更短，视觉上更接近真实段落
      this.setData({
        widths: Array.from({ length: rows }, (_, i) => (i === rows - 1 ? '62%' : '100%')),
        rowList: Array.from({ length: rows }, (_, i) => i)
      })
    }
  }
})
