/**
 * TagInput —— 输入标签。
 *
 * 成词规则走公共层：小程序没有 paste 事件，用户粘贴进来的整段文本
 * 是通过 input 事件一次性到达的——正好由 splitDraft 处理，
 * 与 Web 端「输入中途遇到分隔符」是同一条路径，不必另写一套。
 */
import { DEFAULT_SEPARATORS, addTags, backspace, removeTag, splitDraft, splitTags } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: Array, value: [] },
    placeholder: { type: String, value: '输入后回车' },
    /** 允许重复。默认不允许——重复的标签在任何筛选场景里都是噪声 */
    allowDuplicate: { type: Boolean, value: false },
    /** 最多几个 */
    max: { type: Number, value: 0 },
    disabled: { type: Boolean, value: false },
    /** 除回车外，哪些字符也触发成词 */
    separators: { type: Array, value: DEFAULT_SEPARATORS }
  },
  data: { draft: '', focused: false, full: false },
  observers: {
    'value, max': function (value, max) {
      this.setData({ full: max > 0 && value.length >= max })
    }
  },
  methods: {
    reasonOf(kind) {
      if (kind === 'duplicate') return '已经有相同的标签了'
      if (kind === 'max') return '最多只能添加 ' + this.data.max + ' 个'
      return '空白不能作为标签'
    },

    commit(parts) {
      if (!parts.length) return
      const result = addTags(this.data.value, parts, {
        allowDuplicate: this.data.allowDuplicate,
        max: this.data.max
      })
      if (result.tags.length !== this.data.value.length) {
        this.setData({ value: result.tags })
        this.triggerEvent('change', { value: result.tags })
      }
      // 拒绝的理由要说出来：不给理由的话，用户会以为组件坏了
      if (result.rejected) this.triggerEvent('reject', { reason: this.reasonOf(result.rejected) })
    },

    onInput(e) {
      const text = e.detail.value
      /*
       * 退格：小程序不给 keydown，只能靠「新值比旧值短且旧值本来就空」推断。
       * 输入框有内容时删的仍然是字符——那是所有输入框的通用行为，破坏它用户会不敢用退格。
       */
      if (text === '' && this.data.draft === '') {
        const result = backspace(this.data.value, '')
        if (result.consumed) {
          this.setData({ value: result.tags })
          this.triggerEvent('change', { value: result.tags })
          return ''
        }
      }
      // 中途遇到分隔符就成词，最后一段留在输入框里继续编辑
      const split = splitDraft(text, this.data.separators)
      this.setData({ draft: split.rest })
      this.commit(split.ready)
      return split.rest
    },

    onConfirm(e) {
      this.commit(splitTags(e.detail.value || this.data.draft, this.data.separators))
      this.setData({ draft: '' })
    },

    onRemove(e) {
      const next = removeTag(this.data.value, Number(e.currentTarget.dataset.index))
      this.setData({ value: next })
      this.triggerEvent('change', { value: next })
    },

    onFocus() { this.setData({ focused: true }) },
    onBlur() {
      this.setData({ focused: false })
      this.commit(splitTags(this.data.draft, this.data.separators))
      this.setData({ draft: '' })
    },
    noop() {}
  }
})
