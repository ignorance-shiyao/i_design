import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

export interface ModalProps {
  open: boolean
  title?: string
  width?: string
  /** 表单类对话框建议关闭，避免误点遮罩丢失已填内容 */
  maskClosable?: boolean
  closable?: boolean
  footer?: ReactNode
  onClose: () => void
  children?: ReactNode
}

export function Modal({
  open,
  title = '',
  width = '480px',
  maskClosable = true,
  closable = true,
  footer,
  onClose,
  children
}: ModalProps) {
  const panel = useRef<HTMLDivElement | null>(null)
  const lastActive = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    // 记住触发元素，关闭后把焦点还回去，避免焦点掉到 body
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

  return createPortal(
    <div className="i-modal" onClick={(e) => e.target === e.currentTarget && maskClosable && onClose()}>
      <div
        ref={panel}
        className="i-modal__panel"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title || undefined}
        tabIndex={-1}
      >
        {(title || closable) && (
          <header className="i-modal__header">
            <h3 className="i-modal__title">{title}</h3>
            {closable && (
              <button className="i-modal__close" aria-label="关闭" onClick={onClose}>
                <Icon name="close" size={18} />
              </button>
            )}
          </header>
        )}
        <div className="i-modal__body">{children}</div>
        {footer && <footer className="i-modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}
