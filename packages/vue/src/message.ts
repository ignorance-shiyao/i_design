import Vue from 'vue'
import { ref } from 'vue'
import IMessageList from './components/IMessageList.vue'

export type MessageType = 'info' | 'success' | 'warning' | 'danger'

export interface MessageRecord {
  id: number
  type: MessageType
  content: string
  closable: boolean
}

export interface MessageOptions {
  content: string
  type?: MessageType
  /** 毫秒；传 0 表示不自动关闭 */
  duration?: number
  closable?: boolean
}

export const messages = ref<MessageRecord[]>([])

export function closeMessage(id: number) {
  messages.value = messages.value.filter((m) => m.id !== id)
}

let seed = 0
let host: Vue | null = null

/**
 * 首次调用才挂载容器。
 * Vue 2 没有 createApp，改用 `new Vue({ render })` 手动挂载到一个游离节点上——
 * 这是 Vue 2 里做命令式组件的标准方式。
 */
function ensureHost() {
  if (host || typeof document === 'undefined') return
  const el = document.createElement('div')
  document.body.appendChild(el)
  host = new Vue({ render: (h) => h(IMessageList) })
  host.$mount(el)
}

function open(options: MessageOptions) {
  ensureHost()
  const id = ++seed
  const { content, type = 'info', duration = 3000, closable = false } = options
  messages.value = [...messages.value, { id, type, content, closable }]
  if (duration > 0) setTimeout(() => closeMessage(id), duration)
  return { close: () => closeMessage(id) }
}

type Shortcut = (
  content: string,
  options?: Omit<MessageOptions, 'content' | 'type'>
) => { close: () => void }

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
