/**
 * Mentions —— 提及。
 *
 * 触发判定走公共层：邮箱里的 @ 不该弹、打完空格就该收起、查询串有长度上限。
 * 三条缺一条都会让候选在不该弹的时候弹出来，而两端各写一遍必然分叉。
 *
 * 光标位置用 bindinput 带回来的 cursor 字段——小程序的 textarea 是原生组件，
 * 拿不到 selectionStart，只能靠事件里的这个值。
 */
import { applyMention, filterMentions, findMention, moveMenuActive } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '' },
    options: { type: Array, value: [] },
    /** 触发符，可以多个：@ 提人、/ 唤起命令 */
    symbols: { type: Array, value: ['@'] },
    placeholder: { type: String, value: '' },
    rows: { type: Number, value: 3 }
  },
  data: { matches: [], active: 0, open: false },
  methods: {
    onInput(e) {
      const text = e.detail.value
      const caret = typeof e.detail.cursor === 'number' ? e.detail.cursor : text.length
      this.caret = caret
      this.trigger = findMention(text, caret, this.data.symbols)
      const matches = this.trigger ? filterMentions(this.data.options, this.trigger.query) : []
      this.setData({
        value: text,
        matches,
        active: 0,
        open: !!this.trigger && matches.length > 0
      })
      this.triggerEvent('change', { value: text })
    },

    onChoose(e) {
      const option = this.data.matches[Number(e.currentTarget.dataset.index)]
      if (!option || !this.trigger) return
      const next = applyMention(this.data.value, this.trigger, option.label, this.caret)
      this.trigger = null
      this.caret = next.caret
      this.setData({ value: next.text, open: false })
      this.triggerEvent('change', { value: next.text })
      this.triggerEvent('select', { option })
    },

    /** 供外部键盘（如外接蓝牙键盘）驱动，规则与其余端一致 */
    move(step) {
      if (!this.data.open) return
      this.setData({ active: moveMenuActive(this.data.matches, this.data.active, step) })
    },

    onBlur() {
      // 失焦要收起：小程序的原生 textarea 失焦后面板还挂着，会盖住下面的内容
      this.setData({ open: false })
    }
  }
})
