import { ref } from 'vue'

/**
 * 通知的命令式 API：notification.success('标题', '说明')。
 *
 * 与 message 的分界——一句话的结果反馈用 message（居中、自动消失）；
 * 需要用户读完、甚至去点一下的用 notification（角落、可常驻、带操作）。
 */
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

/*
 * 用 ref 而不是 reactive：Vue 2.7 不能把数组本身作为 reactive 的根，
 * 那样它在 watch / watchEffect 里跟踪不到——同一份代码在 Vue 3 端正常、
 * 在 Vue 2 端通知列表不刷新，而且只会刷一条控制台告警，构建照样绿。
 */
export const notifications = ref<NotificationItem[]>([])
let seed = 0

export function closeNotification(id: number) {
  const index = notifications.value.findIndex((n) => n.id === id)
  if (index !== -1) notifications.value.splice(index, 1)
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
  notifications.value.push({ id, type, title, description: options.description, duration, actions: options.actions })
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
