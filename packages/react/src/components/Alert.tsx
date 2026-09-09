import type { ReactNode } from 'react'
import type { IconName } from '@i-design/common'
import { Icon } from './Icon'

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  closable?: boolean
  onClose?: () => void
  className?: string
  children?: ReactNode
}

const iconOf: Record<string, IconName> = {
  info: 'info-circle',
  success: 'check-circle',
  warning: 'warning-triangle',
  danger: 'error-circle'
}

export function Alert({
  type = 'info',
  title = '',
  closable = false,
  onClose,
  className = '',
  children
}: AlertProps) {
  return (
    <div className={['i-alert', `i-alert--${type}`, className].filter(Boolean).join(' ')} role="alert">
      <Icon className="i-alert__icon" name={iconOf[type]} size={18} />
      <div className="i-alert__content">
        {title && <strong className="i-alert__title">{title}</strong>}
        <div className="i-alert__desc">{children}</div>
      </div>
      {closable && (
        <button className="i-alert__close" aria-label="关闭" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}
