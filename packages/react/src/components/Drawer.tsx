import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

export interface DrawerProps {
  open: boolean
  title?: string
  placement?: 'right' | 'left' | 'top' | 'bottom'
  /** 横向抽屉的宽度 / 纵向抽屉的高度 */
  size?: string
  maskClosable?: boolean
  closable?: boolean
  footer?: ReactNode
  onClose: () => void
  children?: ReactNode
}

export function Drawer({
  open,
  title = '',
  placement = 'right',
  size = '380px',
  maskClosable = true,
  closable = true,
  footer,
  onClose,
  children
}: DrawerProps) {
  const panel = useRef<HTMLDivElement | null>(null)
  const lastActive = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    lastActive.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    const onKeydown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeydown)
    return () => {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
      lastActive.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const horizontal = placement === 'left' || placement === 'right'

  return createPortal(
    <div className="i-drawer" onClick={(e) => e.target === e.currentTarget && maskClosable && onClose()}>
      <div
        ref={panel}
        className={`i-drawer__panel is-${placement}`}
        style={horizontal ? { width: size } : { height: size }}
        role="dialog"
        aria-modal="true"
        aria-label={title || undefined}
        tabIndex={-1}
      >
        {(title || closable) && (
          <header className="i-drawer__header">
            <h3 className="i-drawer__title">{title}</h3>
            {closable && (
              <button className="i-drawer__close" aria-label="关闭" onClick={onClose}>
                <Icon name="close" size={18} />
              </button>
            )}
          </header>
        )}
        <div className="i-drawer__body">{children}</div>
        {footer && <footer className="i-drawer__footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}
