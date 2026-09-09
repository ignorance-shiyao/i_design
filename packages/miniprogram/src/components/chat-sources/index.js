/**
 * ChatSources —— 回答引用的来源。
 * 小程序里点击来源无法直接开外链，因此只抛事件，由页面决定是走
 * web-view 还是复制链接——各家小程序的外链策略并不相同。
 */
Component({
  options: { addGlobalClass: true },
  properties: { sources: { type: Array, value: [] } },
  methods: {
    onTap(e) {
      const index = e.currentTarget.dataset.index
      this.triggerEvent('select', { index, source: this.data.sources[index] })
    }
  }
})
