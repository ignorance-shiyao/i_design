import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Placement } from '@i-design/common'
import { arrowStyle, useOverlayPosition } from '../useOverlayPosition'
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
  placement?: Placement
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

  const close = useCallback(() => {
    setVisible(false)
    // 焦点交还触发元素，否则关闭后键盘用户会失去位置
    root.current
      ?.querySelector<HTMLElement>('button, [tabindex]:not([tabindex="-1"])')
      ?.focus()
  }, [])

  const { pos } = useOverlayPosition(root, panel, visible, {
    placement,
    closeOnOutsideClick: true,
    onOutsideClick: () => setVisible(false)
  })

  useEffect(() => {
    if (!visible) return
    panel.current?.querySelector('button')?.focus()
    const onKeydown = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [visible, close])

  return (
    <>
      <span ref={root} className="i-popconfirm">
        <span className="i-popconfirm__trigger" onClick={() => !disabled && setVisible(!visible)}>
          {children}
        </span>
      </span>

      {visible &&
        createPortal(
          <div
            ref={panel}
            className={`i-popconfirm__panel is-${pos.placement}`}
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            role="dialog"
            aria-label={title}
          >
            <span className="i-popconfirm__arrow" style={arrowStyle(pos)} />
            <div className="i-popconfirm__head">
              <Icon className={`i-popconfirm__icon is-${type}`} name={icon} size={17} />
              <div>
                <p className="i-popconfirm__title">{title}</p>
                {content && <p className="i-popconfirm__content">{content}</p>}
              </div>
            </div>
            <div className="i-popconfirm__foot">
              <Button
                size="sm"
                onClick={() => {
                  onCancel?.()
                  close()
                }}
              >
                {cancelText}
              </Button>
              <Button
                size="sm"
                variant={type === 'danger' ? 'danger' : 'primary'}
                onClick={() => {
                  onConfirm?.()
                  close()
                }}
              >
                {confirmText}
              </Button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
