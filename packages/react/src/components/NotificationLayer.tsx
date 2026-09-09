import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { Button } from './Button'
import type { IconName } from '@i-design/common'

export type NotificationType = 'info' | 'success' | 'warning' | 'danger'

export interface NotificationAction {
  label: string
  onClick: () => void
}

export interface NotificationItem {
  id: number
  type: NotificationType
  title: string
  description?: string
  /** 0 表示不自动关闭：需要用户处理的通知不该自己消失 */
  duration: number
  actions?: NotificationAction[]
}

const ICONS: Record<NotificationType, IconName> = {
  info: 'info-circle',
  success: 'check-circle',
  warning: 'warning-triangle',
  danger: 'error-circle'
}

/* 订阅式的小仓库：命令式 API 要能在任何组件外调用 */
let items: NotificationItem[] = []
let seed = 0
const listeners = new Set<(list: NotificationItem[]) => void>()
const emit = () => listeners.forEach((fn) => fn([...items]))

export function closeNotification(id: number) {
  items = items.filter((n) => n.id !== id)
  emit()
}

export interface NotifyOptions {
  description?: string
  duration?: number
  actions?: NotificationAction[]
}

function push(type: NotificationType, title: string, options: NotifyOptions = {}) {
  const id = ++seed
  // 带操作的通知默认不自动关闭：正要去点，它消失了
  const duration = options.duration ?? (options.actions?.length ? 0 : 4500)
  items = [...items, { id, type, title, description: options.description, duration, actions: options.actions }]
  emit()
  if (duration > 0) setTimeout(() => closeNotification(id), duration)
  return id
}

export const notification = {
  info: (title: string, options?: NotifyOptions) => push('info', title, options),
  success: (title: string, options?: NotifyOptions) => push('success', title, options),
  warning: (title: string, options?: NotifyOptions) => push('warning', title, options),
  danger: (title: string, options?: NotifyOptions) => push('danger', title, options),
  close: closeNotification
}

/** 挂在应用根部一次即可，通知由 notification.* 命令式推入 */
export function NotificationLayer() {
  const [list, setList] = useState<NotificationItem[]>(items)

  useEffect(() => {
    listeners.add(setList)
    return () => {
      listeners.delete(setList)
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="i-notification-layer">
      {list.map((item) => (
        <div key={item.id} className={`i-notification i-notification--${item.type}`} role="status">
          <span className="i-notification__icon">
            <Icon name={ICONS[item.type]} size={18} />
          </span>
          <div className="i-notification__body">
            <p className="i-notification__title">{item.title}</p>
            {item.description && <p className="i-notification__desc">{item.description}</p>}
            {!!item.actions?.length && (
              <div className="i-notification__actions">
                {item.actions.map((action) => (
                  <Button
                    key={action.label}
                    size="sm"
                    onClick={() => {
                      action.onClick()
                      closeNotification(item.id)
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <button
            className="i-notification__close"
            aria-label="关闭"
            onClick={() => closeNotification(item.id)}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
