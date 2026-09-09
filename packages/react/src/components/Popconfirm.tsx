import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { IconName } from '@i-design/common'
import { Button } from './Button'
import { Icon } from './Icon'

export interface PopconfirmProps {
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  /** 破坏性操作用 danger，让确认按钮本身说明后果 */
  type?: 'brand' | 'danger'
  placement?: 'top' | 'bottom' | 'left' | 'right'
  icon?: IconName
  disabled?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  children?: ReactNode
}

export function Popconfirm({
  title = '确认执行该操作？',
  content = '',
  confirmText = '确定',
  cancelText = '取消',
  type = 'brand',
  placement = 'top',
  icon = 'help-circle',
  disabled = false,
  onConfirm,
  onCancel,
  children
}: PopconfirmProps) {
  const root = useRef<HTMLSpanElement | null>(null)
  const panel = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!visible) return
    panel.current?.querySelector('button')?.focus()
    const onClickOutside = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setVisible(false)
    }
    const onKeydown = (e: KeyboardEvent) => e.key === 'Escape' && setVisible(false)
    document.addEventListener('click', onClickOutside)
    document.addEventListener('keydown', onKeydown)
    return () => {
      document.removeEventListener('click', onClickOutside)
      document.removeEventListener('keydown', onKeydown)
    }
  }, [visible])

  return (
    <span ref={root} className="i-popconfirm">
      <span className="i-popconfirm__trigger" onClick={() => !disabled && setVisible(!visible)}>
        {children}
      </span>
      {visible && (
        <div ref={panel} className={`i-popconfirm__panel is-${placement}`} role="dialog" aria-label={title}>
          <div className="i-popconfirm__head">
            <Icon className={`i-popconfirm__icon is-${type}`} name={icon} size={17} />
            <div>
              <p className="i-popconfirm__title">{title}</p>
              {content && <p className="i-popconfirm__content">{content}</p>}
            </div>
          </div>
          <div className="i-popconfirm__foot">
            <Button size="sm" onClick={() => { onCancel?.(); setVisible(false) }}>
              {cancelText}
            </Button>
            <Button
              size="sm"
              variant={type === 'danger' ? 'danger' : 'primary'}
              onClick={() => { onConfirm?.(); setVisible(false) }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      )}
    </span>
  )
}
