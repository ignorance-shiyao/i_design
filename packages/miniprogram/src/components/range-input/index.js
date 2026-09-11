/**
 * RangeInput —— 区间输入。
 * 起止对调的规则来自公共层，与 Web 端同一份实现——
 * 一端自动对调、另一端不动的话，同一份数据在两端上得到的结果不同。
 */
import { orderRange } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: Array, value: ['', ''] },
    placeholders: { type: Array, value: ['开始', '结束'] },
    separator: { type: String, value: '—' },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
    invalid: { type: Boolean, value: false },
    /** 失焦时若起大于止就自动对调；输入过程中不做 */
    autoOrder: { type: Boolean, value: true }
  },
  data: { focused: false },
  methods: {
    onStart(e) { this.emit([e.detail.value, this.data.value[1]]) },
    onEnd(e) { this.emit([this.data.value[0], e.detail.value]) },
    onFocus() { this.setData({ focused: true }) },
    onBlur() {
      this.setData({ focused: false })
      const next = this.data.autoOrder ? orderRange(this.data.value) : this.data.value
      if (next !== this.data.value) this.emit(next)
      this.triggerEvent('change', { value: next })
    },
    emit(value) {
      this.setData({ value })
      this.triggerEvent('input', { value })
    }
  }
})
