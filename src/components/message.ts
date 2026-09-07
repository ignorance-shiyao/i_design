import { createApp, type App } from 'vue'
import IMessageList from './IMessageList.vue'
import { closeMessage, messages, type MessageType } from './messageState'

export type { MessageType, MessageRecord } from './messageState'

export interface MessageOptions {
  content: string
  type?: MessageType
  /** 毫秒；传 0 表示不自动关闭 */
  duration?: number
  closable?: boolean
}

let seed = 0
let host: App | null = null

/** 首次调用时才挂载容器，未用到 Message 的页面不会多出 DOM 节点 */
function ensureHost() {
  if (host || typeof document === 'undefined') return
  const el = document.createElement('div')
  document.body.appendChild(el)
  host = createApp(IMessageList)
  host.mount(el)
}

function open(options: MessageOptions) {
  ensureHost()
  const id = ++seed
  const { content, type = 'info', duration = 3000, closable = false } = options
  messages.value = [...messages.value, { id, type, content, closable }]
  if (duration > 0) setTimeout(() => closeMessage(id), duration)
  return { close: () => closeMessage(id) }
}

type Shortcut = (content: string, options?: Omit<MessageOptions, 'content' | 'type'>) => { close: () => void }

const shortcut =
  (type: MessageType): Shortcut =>
  (content, options = {}) =>
    open({ ...options, content, type })

export const message = {
  open,
  info: shortcut('info'),
  success: shortcut('success'),
  warning: shortcut('warning'),
  error: shortcut('danger'),
  /** 清空当前所有消息，常用于路由切换时 */
  closeAll: () => (messages.value = [])
}
