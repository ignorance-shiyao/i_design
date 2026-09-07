import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { IconName } from '@i-design/common'
import { Icon } from './Icon'

export type MessageType = 'info' | 'success' | 'warning' | 'danger'

export interface MessageOptions {
  content: string
  type?: MessageType
  /** 毫秒；传 0 表示不自动关闭 */
  duration?: number
  closable?: boolean
}

interface MessageRecord extends Required<MessageOptions> {
  id: number
}

const iconOf: Record<MessageType, IconName> = {
  info: 'info-circle',
  success: 'check-circle',
  warning: 'warning-triangle',
  danger: 'error-circle'
}

let seed = 0
let emit: ((records: MessageRecord[]) => void) | null = null
let records: MessageRecord[] = []
let mounted = false

function sync() {
  emit?.([...records])
}

function close(id: number) {
  records = records.filter((m) => m.id !== id)
  sync()
}

/** 首次调用才挂载容器，未用到 Message 的页面不会多出 DOM 节点 */
function ensureHost() {
  if (mounted || typeof document === 'undefined') return
  mounted = true
  const el = document.createElement('div')
  document.body.appendChild(el)
  createRoot(el).render(<MessageHost />)
}

function open(options: MessageOptions) {
  ensureHost()
  const id = ++seed
  const record: MessageRecord = {
    id,
    content: options.content,
    type: options.type ?? 'info',
    duration: options.duration ?? 3000,
    closable: options.closable ?? false
  }
  records = [...records, record]
  sync()
  if (record.duration > 0) setTimeout(() => close(id), record.duration)
  return { close: () => close(id) }
}

const shortcut = (type: MessageType) => (content: string, options: Omit<MessageOptions, 'content' | 'type'> = {}) =>
  open({ ...options, content, type })

export const message = {
  open,
  info: shortcut('info'),
  success: shortcut('success'),
  warning: shortcut('warning'),
  error: shortcut('danger'),
  closeAll: () => { records = []; sync() }
}

function MessageHost() {
  const [list, setList] = useState<MessageRecord[]>([])
  useEffect(() => {
    emit = setList
    setList([...records])
    return () => { emit = null }
  }, [])

  if (!list.length) return null

  return (
    // aria-live 让读屏软件在不抢焦点的前提下播报新消息
    <div className="i-message-list" role="status" aria-live="polite">
      {list.map((item) => (
        <div key={item.id} className={`i-message i-message--${item.type}`}>
          <Icon className="i-message__icon" name={iconOf[item.type]} size={18} />
          <span className="i-message__text">{item.content}</span>
          {item.closable && (
            <button className="i-message__close" aria-label="关闭" onClick={() => close(item.id)}>
              <Icon name="close" size={15} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
