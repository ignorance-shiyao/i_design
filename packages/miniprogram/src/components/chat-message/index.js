/**
 * ChatMessage —— 小程序端的一条会话消息。
 *
 * 与 Web 端同一套类名与排版规则：用户消息右对齐气泡，助手消息通栏正文。
 * 操作区在这里常驻显示——小程序没有 hover，藏起来就等于没有。
 */
import { getLocale } from '../../config'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  data: { retryLabel: '', regenerateLabel: '', copyLabel: '' },
  lifetimes: {
    attached() { this.syncLocale() }
  },
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
    /* 「重试」与「重新生成」是两件事：一个是失败后重来，一个是对结果不满意再来一次 */
    syncLocale() {
      const locale = getLocale()
      this.setData({
        retryLabel: locale.retry,
        regenerateLabel: locale.regenerate,
        copyLabel: locale.copy,
      })
    },
    onCopy() { this.triggerEvent('copy') },
    onRetry() { this.triggerEvent('retry') }
  }
})
