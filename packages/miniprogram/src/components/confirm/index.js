import { confirmActions, isConfirmed, validatePromptValue } from '@i-design/common'

/**
 * 命令式确认框。
 *
 * 这一端没有「往 body 上挂一个容器」的办法，因此写成一个组件：
 * 在页面里放一次 <i-confirm id="confirm" />，再用 selectComponent('#confirm')
 * 拿到实例调 confirm / alert / prompt。按钮编排与校验规则来自公共层，
 * 因此三端的按钮顺序、破坏性配色、校验时机完全一致。
 *
 * 不用 wx.showModal：它只有两个按钮、没有输入校验，
 * 而且样式跟随系统，和产品其余部分对不上。
 */
Component({
  options: { addGlobalClass: true },
  data: {
    queue: [],
    value: '',
    error: ''
  },
  methods: {
    confirm(options) {
      return this._open('confirm', options || {}).then(() => true)
    },
    alert(options) {
      return this._open('alert', options || {}).then(() => true)
    },
    prompt(options) {
      return this._open('prompt', options || {})
    },

    _open(kind, options) {
      this._seed = (this._seed || 0) + 1
      const id = this._seed
      return new Promise((resolve, reject) => {
        const record = {
          id,
          kind,
          title: options.title || '',
          content: options.content || '',
          danger: !!options.danger,
          // 破坏性确认默认不允许点遮罩关闭：那一下太容易误触，而它旁边就是「确定」
          maskClosable: options.maskClosable === undefined ? !options.danger : !!options.maskClosable,
          placeholder: options.placeholder || '',
          defaultValue: options.defaultValue || '',
          rules: {
            required: options.required,
            pattern: options.pattern,
            validate: options.validate,
            requiredMessage: options.requiredMessage,
            patternMessage: options.patternMessage
          },
          actions: confirmActions(kind, {
            confirmText: options.confirmText || (kind === 'alert' ? '知道了' : '确定'),
            cancelText: options.cancelText || '取消',
            danger: !!options.danger
          }),
          resolve,
          reject
        }
        const queue = [...this.data.queue, record]
        this.setData({
          queue,
          // 新弹出的这个自己的默认值，不沿用上一个的残值
          value: record.defaultValue,
          error: ''
        })
      })
    },

    _settle(role) {
      const queue = this.data.queue
      const item = queue[queue.length - 1]
      if (!item) return

      if (item.kind === 'prompt' && role === 'confirm') {
        const error = validatePromptValue(this.data.value, item.rules)
        if (error) {
          this.setData({ error })
          return
        }
      }

      // 先把值取出来再重置：setData 之后 this.data.value 已经是下一个框的默认值了
      const settled = this.data.value

      const rest = queue.slice(0, -1)
      const previous = rest[rest.length - 1]
      this.setData({
        queue: rest,
        value: previous ? previous.defaultValue : '',
        error: ''
      })

      // 取消走 reject，与 Web 端一致：调用方 await 之后就是「用户同意了才做的事」
      if (isConfirmed(item.kind, role)) item.resolve(settled)
      else item.reject(new Error('cancelled'))
    },

    onAction(event) {
      this._settle(event.currentTarget.dataset.role)
    },
    onMask() {
      const item = this.data.queue[this.data.queue.length - 1]
      if (item && item.maskClosable) this._settle('close')
    },
    onInput(event) {
      /* 改了就把错误清掉：留着旧错误会让人以为改了也没用 */
      this.setData({ value: event.detail.value, error: '' })
    },
    noop() {}
  }
})
