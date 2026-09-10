/**
 * NumberKeypad —— 数字键盘。
 *
 * 不用小程序的原生数字键盘：约束（几位小数、能不能有负号、最长多少位）
 * 交给系统就没法与 Web 端保持一致，同一个表单在两端上能输入的东西会不一样。
 * 按键规则全部走公共层的 pressKey。
 */
import { keyLabel, keypadRows, pressKey } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '' },
    /** 最多几位小数。0 表示不允许小数点 */
    decimals: { type: Number, value: 2 },
    /** 最大长度，按字符数算（含小数点与负号） */
    maxLength: { type: Number, value: 12 },
    /** 允许负数，键盘上多一个 +/- 键 */
    negative: { type: Boolean, value: false },
    /** 右侧的确认列。金额场景常见，验证码场景不需要 */
    confirmText: { type: String, value: '' }
  },
  data: { keys: [] },
  observers: {
    'decimals, negative': function () { this.buildKeys() }
  },
  lifetimes: {
    attached() { this.buildKeys() },
    detached() { this.onHoldEnd() }
  },
  methods: {
    buildKeys() {
      const rows = keypadRows({ decimals: this.data.decimals, negative: this.data.negative })
      const keys = []
      rows.forEach((row, r) => {
        row.forEach((key, k) => {
          keys.push({
            id: r + '-' + k,
            key,
            // 占位格不给读屏文案，否则会念出一个没有名字的按钮
            label: key === '' ? '' : keyLabel(key),
            text: key === 'sign' ? '+/−' : key,
            fn: key === 'backspace' || key === 'sign'
          })
        })
      })
      this.setData({ keys })
    },

    press(key) {
      if (!key) return
      const next = pressKey(this.data.value, key, {
        decimals: this.data.decimals,
        maxLength: this.data.maxLength,
        negative: this.data.negative
      })
      this.setData({ value: next })
      this.triggerEvent('change', { value: next })
    },

    onKey(e) { this.press(e.currentTarget.dataset.key) },

    /** 长按删除键连续退格：输错一长串时一下一下点太慢 */
    onHoldStart(e) {
      if (e.currentTarget.dataset.key !== 'backspace') return
      this.delay = setTimeout(() => {
        this.repeat = setInterval(() => this.press('backspace'), 80)
      }, 400)
    },

    onHoldEnd() {
      if (this.delay) clearTimeout(this.delay)
      if (this.repeat) clearInterval(this.repeat)
      this.delay = null
      this.repeat = null
    },

    onConfirm() { this.triggerEvent('confirm', { value: this.data.value }) }
  }
})
