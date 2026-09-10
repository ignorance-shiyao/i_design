/**
 * ContextCards —— 检索到的知识片段与它们的出处。
 * 折叠阈值与字符统计走共享的 chunkLength / chunkPreview：
 * 按码点算而不是按 UTF-16 单元，否则截断会把 emoji 劈成两半。
 */
import { chunkLength, chunkPreview, fileTypeOf } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    chunks: { type: Array, value: [] },
    title: { type: String, value: '引用片段' },
    previewLimit: { type: Number, value: 140 }
  },
  data: { rows: [], open: [] },
  observers: { 'chunks, previewLimit': function () { this.refresh() } },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const { chunks, previewLimit, open } = this.data
      /*
       * 展示态在这里算完：WXML 里做不了 Set.has、也切不了字符串，
       * 而按码点截断更不可能在模板里表达。
       */
      this.setData({
        rows: chunks.map((chunk) => {
          const length = chunkLength(chunk.content)
          const expanded = open.indexOf(chunk.id) !== -1
          const type = chunk.source ? fileTypeOf(chunk.source) : null
          return {
            id: chunk.id,
            title: chunk.title,
            length,
            text: expanded ? chunk.content : chunkPreview(chunk.content, previewLimit),
            expanded,
            foldable: length > previewLimit,
            source: chunk.source || '',
            href: chunk.href || '',
            icon: type ? type.icon : '',
            slot: type ? type.slot || 1 : 1
          }
        })
      })
    },
    onToggle(event) {
      const id = event.currentTarget.dataset.id
      const open = this.data.open.indexOf(id) !== -1
        ? this.data.open.filter((k) => k !== id)
        : this.data.open.concat(id)
      this.setData({ open }, () => this.refresh())
    },
    onSource(event) {
      this.triggerEvent('source', { id: event.currentTarget.dataset.id })
    }
  }
})
