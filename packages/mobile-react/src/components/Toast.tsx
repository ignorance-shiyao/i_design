import { useEffect, useState } from 'react'
import { nextToastId, resolveDuration, type ToastRecord } from '@i-design/common'
import { Icon } from '@i-design/react'
import type { IconName } from '@i-design/common'

const iconOf: Partial<Record<ToastRecord['type'], IconName>> = {
  success: 'check-circle',
  warning: 'warning-triangle',
  error: 'error-circle',
  loading: 'refresh'
}

let push: ((record: ToastRecord) => void) | null = null

/**
 * 命令式 Toast：移动端的反馈往往发生在手指离开屏幕之后，
 * 要求业务代码在模板里预埋一个组件并不现实。
 */
export const toast = {
  show(content: string, type: ToastRecord['type'] = 'text', duration?: number) {
    const record: ToastRecord = {
      id: nextToastId(),
      content,
      type,
      duration: resolveDuration(type, duration)
    }
    push?.(record)
    return record.id
  },
  success: (content: string, duration?: number) => toast.show(content, 'success', duration),
  error: (content: string, duration?: number) => toast.show(content, 'error', duration),
  loading: (content: string) => toast.show(content, 'loading')
}

/** 挂在应用根部即可，无需在每个页面重复放置 */
export function ToastHost() {
  const [current, setCurrent] = useState<ToastRecord | null>(null)

  useEffect(() => {
    push = (record) => setCurrent(record)
    return () => { push = null }
  }, [])

  useEffect(() => {
    if (!current || current.duration <= 0) return
    const timer = setTimeout(() => setCurrent(null), current.duration)
    return () => clearTimeout(timer)
  }, [current])

  if (!current) return null
  const icon = iconOf[current.type]

  return (
    <div className="i-toast" role="status" aria-live="polite">
      {icon && <Icon className="i-toast__icon" name={icon} size={26} spin={current.type === 'loading'} />}
      <span>{current.content}</span>
    </div>
  )
}
