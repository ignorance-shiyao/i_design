/**
 * PromptInput —— 会话输入台。
 *
 * 小程序的 <textarea> 是原生组件：它自带 auto-height，因此不需要 Web 端那套
 * 量 scrollHeight 的做法；但它也会盖在其他元素之上，所以发送按钮与它同级平铺，
 * 而不是浮在输入框内部。
 */
import { applyMention, fileTypeOf, filterMentions, findMention, formatSize } from '@i-design/common'
import { getLocale } from '../../config'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: '' },
    disabled: { type: Boolean, value: false },
    generating: { type: Boolean, value: false },
    maxLength: { type: Number, value: 0 },
    attachments: { type: Array, value: [] },
    hint: { type: String, value: '' },
    /** 打 `@` 时可引用的来源；不给就不弹 */
    mentions: { type: Array, value: [] },
    /** 打 `/` 时可用的命令；不给就不弹 */
    commands: { type: Array, value: [] }
  },
  data: {
    focused: false,
    length: 0,
    over: false,
    canSend: false,
    files: [],
    options: [],
    symbol: '',
    placeholderText: '',
    attachText: ''
  },
  lifetimes: {
    attached() {
      /* 占位与按钮名都走字典：写死中文的话，换成英文字典后这一块会是唯一还说中文的地方 */
      const locale = getLocale()
      this.setData({
        placeholderText: this.data.placeholder || locale.promptPlaceholder,
        attachText: locale.attach
      })
    }
  },
  observers: {
    'value, maxLength, disabled': function (value, maxLength, disabled) {
      const length = (value || '').length
      const over = maxLength > 0 && length > maxLength
      this.setData({
        length,
        over,
        canSend: !disabled && !over && (value || '').trim().length > 0
      })
    },
    attachments: function (files) {
      this.setData({
        // 类型图标与配色在这里算好：WXML 里调不了函数
        files: files.map((f) => {
          const type = fileTypeOf(f.name || '')
          return {
            ...f,
            sizeText: f.size ? formatSize(f.size) : '',
            typeIcon: type.icon,
            typeLabel: type.label,
            typeSlot: type.slot || 1
          }
        })
      })
    }
  },
  methods: {
    onInput(e) {
      this.triggerEvent('change', { value: e.detail.value })
      /*
       * 这一端拿光标位置只有 bindinput 的 detail.cursor 一条路：
       * 原生 textarea 不暴露 selectionStart，点击换位置也不会给事件。
       * 所以候选只在打字时跟着更新，够用——用户正是在打字时才需要它。
       */
      this.syncTrigger(e.detail.value, e.detail.cursor)
    },

    syncTrigger(value, cursor) {
      const symbols = []
      if ((this.data.mentions || []).length) symbols.push('@')
      if ((this.data.commands || []).length) symbols.push('/')
      if (!symbols.length) return

      const caret = typeof cursor === 'number' ? cursor : (value || '').length
      const trigger = findMention(value || '', caret, symbols)
      this.trigger = trigger
      this.caret = caret
      const pool = trigger ? (trigger.symbol === '/' ? this.data.commands : this.data.mentions) : []
      this.setData({
        // 空面板比没有面板更糟：它挡住正文，还多占一屏
        options: trigger ? filterMentions(pool, trigger.query) : [],
        symbol: trigger ? trigger.symbol : ''
      })
    },

    onPick(e) {
      if (!this.trigger) return
      const option = this.data.options[e.currentTarget.dataset.index]
      const next = applyMention(this.data.value || '', this.trigger, option.label, this.caret)
      this.trigger = null
      this.setData({ options: [], symbol: '' })
      this.triggerEvent('change', { value: next.text })
      this.triggerEvent('pick', { option, symbol: e.currentTarget.dataset.symbol })
    },

    onFocus() { this.setData({ focused: true }) },
    onBlur() { this.setData({ focused: false }) },
    onSubmit() {
      if (!this.data.canSend) return
      this.triggerEvent('submit', { value: this.data.value })
    },
    onStop() { this.triggerEvent('stop') },
    onAttach() { this.triggerEvent('attach') },
    onRemove(e) { this.triggerEvent('removeattachment', { index: e.currentTarget.dataset.index }) }
  }
})
