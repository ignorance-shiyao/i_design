/**
 * InputOtp —— 验证码输入。
 *
 * 小程序没有「一次性验证码自动填充」，粘贴也走不到 paste 事件；
 * 但分格、退格、合法字符这几条规则仍来自公共层，与 Web 端同一份实现。
 */
import { isOtpChar, otpBackspace, otpNextIndex, otpValue } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '' },
    length: { type: Number, value: 6 },
    mode: { type: String, value: 'numeric' },
    password: { type: Boolean, value: false },
    separatorAt: { type: Number, value: 0 },
    disabled: { type: Boolean, value: false },
    invalid: { type: Boolean, value: false }
  },
  data: { cells: [], focusIndex: 0 },
  observers: {
    'value, length': function (value, length) {
      const chars = String(value || '').split('')
      this.setData({
        cells: Array.from({ length }, (_, i) => chars[i] || '')
      })
    }
  },
  methods: {
    /*
     * 小程序的 input 没有 keydown，退格只能从「值变空了」推断：
     * 本来有字符、这次输入后空了，就按退格处理——退到前一格并清掉它。
     * （这正是 otpBackspace 的规则，与 Web 端同一份。）
     */
    onInput(e) {
      const index = e.currentTarget.dataset.index
      const raw = e.detail.value || ''
      const char = raw.split('').reverse().find((c) => isOtpChar(c, this.data.mode)) || ''

      if (!char && this.data.cells[index]) {
        const next = otpBackspace(this.data.cells, index)
        this.commit(next.cells, next.index)
        return
      }

      const cells = this.data.cells.slice()
      cells[index] = char
      this.commit(cells, char ? otpNextIndex(index, this.data.length) : index)
    },
    commit(cells, focusIndex) {
      this.setData({ cells, focusIndex })
      const full = otpValue(cells)
      this.triggerEvent('input', { value: full })
      if (full) this.triggerEvent('complete', { value: full })
    }
  }
})
