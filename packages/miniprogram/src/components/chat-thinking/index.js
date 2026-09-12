/**
 * ChatThinking —— 推理过程，默认折叠。
 * 折叠是有意的：推理过程对排查问题有用，但它不是答案。
 */
import { getLocale } from '../../config'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    label: { type: String, value: '' },
    duration: { type: String, value: '' },
    pending: { type: Boolean, value: false },
    defaultOpen: { type: Boolean, value: false },
    text: { type: String, value: '' }
  },
  data: { open: false, labelText: '' },
  lifetimes: {
    attached() {
      this.syncLocale()
      this.setData({ open: this.data.defaultOpen }) }
  },
  methods: {
    /* 标题走字典：不传时用「推理过程」那一句，传了以传进来的为准 */
    syncLocale() {
      const locale = getLocale()
      this.setData({
        labelText: this.data.label || locale.thinking,
      })
    },
    onToggle() { this.setData({ open: !this.data.open }) }
  }
})
