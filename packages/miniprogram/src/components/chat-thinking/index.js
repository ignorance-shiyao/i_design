/**
 * ChatThinking —— 推理过程，默认折叠。
 * 折叠是有意的：推理过程对排查问题有用，但它不是答案。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    label: { type: String, value: '推理过程' },
    duration: { type: String, value: '' },
    pending: { type: Boolean, value: false },
    defaultOpen: { type: Boolean, value: false },
    text: { type: String, value: '' }
  },
  data: { open: false },
  lifetimes: {
    attached() { this.setData({ open: this.data.defaultOpen }) }
  },
  methods: {
    onToggle() { this.setData({ open: !this.data.open }) }
  }
})
