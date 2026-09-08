import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface PopupProps {
  open: boolean
  /** 从哪一侧滑出 */
  placement?: 'bottom' | 'top' | 'left' | 'right' | 'center'
  maskClosable?: boolean
  /** 顶部的拖拽提示条，告诉用户这层可以关掉 */
  handle?: boolean
  maxHeight?: string
  onClose?: () => void
  children?: ReactNode
  className?: string
}

export function Popup({
  open,
  placement = 'bottom',
  maskClosable = true,
  handle = true,
  maxHeight = '80%',
  onClose,
  children,
  className = ''
}: PopupProps) {
  // 打开时锁住背景滚动：手指划在弹层之外会带着底下的页面一起动
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className={['i-popup', `i-popup--${placement}`, className].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
    >
      <div className="i-popup__mask" onClick={() => maskClosable && onClose?.()} />
      <div
        className="i-popup__panel"
        style={{ maxHeight: placement === 'bottom' || placement === 'top' ? maxHeight : undefined }}
      >
        {handle && (placement === 'bottom' || placement === 'top') && <span className="i-popup__handle" />}
        <div className="i-popup__body">{children}</div>
      </div>
    </div>,
    document.body
  )
}
