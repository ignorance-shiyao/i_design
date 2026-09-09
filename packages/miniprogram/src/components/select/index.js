/**
 * Select —— 选项禁用与高亮移动的规则来自公共层，与 Web 端同一份实现。
 *
 * 小程序没有 hover 与 Teleport，因此面板是紧跟触发器的一层绝对定位视图，
 * 而不是挂到根节点的浮层。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: null, value: '' },
    options: { type: Array, value: [] },
    placeholder: { type: String, value: '请选择' },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
    clearable: { type: Boolean, value: false },
    emptyText: { type: String, value: '无匹配选项' }
  },
  data: { open: false, label: '', hasValue: false },
  observers: {
    'value, options': function (value, options) {
      const hit = options.find((o) => o.value === value)
      this.setData({ label: hit ? hit.label : '', hasValue: !!hit })
    }
  },
  methods: {
    onToggle() {
      if (this.data.disabled) return
      this.setData({ open: !this.data.open })
    },
    onPick(e) {
      const { value, disabled } = e.currentTarget.dataset
      if (disabled) return
      this.setData({ open: false })
      this.triggerEvent('change', { value })
    },
    onClear() {
      // 阻止冒泡到触发器，否则清空的同时又把面板打开了
      this.setData({ open: false })
      this.triggerEvent('change', { value: '' })
    },
    onClose() { this.setData({ open: false }) }
  }
})
