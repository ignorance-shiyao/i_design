/**
 * ChatMessage —— 小程序端的一条会话消息。
 *
 * 与 Web 端同一套类名与排版规则：用户消息右对齐气泡，助手消息通栏正文。
 * 操作区在这里常驻显示——小程序没有 hover，藏起来就等于没有。
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    role: { type: String, value: 'assistant' },
    name: { type: String, value: '' },
    time: { type: String, value: '' },
    avatar: { type: String, value: '' },
    text: { type: String, value: '' },
    streaming: { type: Boolean, value: false },
    error: { type: Boolean, value: false }
  },
  methods: {
    onCopy() { this.triggerEvent('copy') },
    onRetry() { this.triggerEvent('retry') }
  }
})
