Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    current: { type: Number, value: 0 },
    direction: { type: String, value: 'horizontal' },
    status: { type: String, value: 'process' },
    clickable: { type: Boolean, value: false }
  },
  data: { states: [] },
  observers: {
    'items, current, status': function (items, current, status) {
      this.setData({
        states: items.map((item, index) => ({
          ...item,
          state:
            index < current ? 'finish' : index > current ? 'wait' : status === 'error' ? 'error' : 'process'
        }))
      })
    }
  },
  methods: {
    onPick(e) {
      // 只允许回到已完成的步骤，避免跳过未填写的表单
      const index = e.currentTarget.dataset.index
      if (!this.data.clickable || index >= this.data.current) return
      this.triggerEvent('change', index)
    }
  }
})
