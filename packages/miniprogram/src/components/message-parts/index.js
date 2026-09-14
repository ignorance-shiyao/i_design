/**
 * MessageParts —— 小程序实现。
 *
 * 段的类型判断与引用编号都在 JS 里算好再塞进 data：WXML 不能调用函数，
 * 在模板里用一串三元表达式拼这些，改一次就要在两处对着改。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    parts: { type: Array, value: [] },
    sources: { type: Array, value: [] },
    compact: { type: Boolean, value: false }
  },
  data: { items: [] },
  observers: {
    'parts, sources': function (parts, sources) {
      // 引用按出现顺序编号：读者看到的是 [1][2]，不是一串 uuid
      const order = new Map()
      for (const part of parts) {
        if (part.kind !== 'citation') continue
        const id = (part.meta && part.meta.sourceId) || part.text
        if (!order.has(id)) order.set(id, order.size + 1)
      }
      const titleOf = (id) => (sources.find((s) => s.id === id) || {}).title || id

      this.setData({
        items: parts.map((part) => {
          const meta = part.meta || {}
          const id = meta.sourceId || part.text
          return {
            id: part.id,
            kind: part.kind,
            text: part.text,
            complete: !!part.complete,
            lang: meta.lang || '',
            name: meta.name || '工具调用',
            title: meta.title || '产物',
            version: meta.version || '',
            citeIndex: order.get(id) || 0,
            citeTitle: titleOf(id),
            sourceId: id
          }
        })
      })
    }
  },
  methods: {
    cite(e) {
      this.triggerEvent('cite', e.currentTarget.dataset.id)
    }
  }
})
