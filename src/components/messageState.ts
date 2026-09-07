import { ref } from 'vue'

export type MessageType = 'info' | 'success' | 'warning' | 'danger'

export interface MessageRecord {
  id: number
  type: MessageType
  content: string
  closable: boolean
}

/**
 * 消息队列的单一数据源。
 * 单独成文件是为了让 message.ts（命令式 API）与 IMessageList.vue（渲染）
 * 共享同一个 ref 而不互相 import，避免循环依赖。
 */
export const messages = ref<MessageRecord[]>([])

export function closeMessage(id: number) {
  messages.value = messages.value.filter((m) => m.id !== id)
}
