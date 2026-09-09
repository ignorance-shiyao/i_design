import { useId, useRef, useState, type ReactNode } from 'react'

export interface TooltipProps {
  content?: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** 悬浮多久后出现，避免鼠标划过一排按钮时连续闪烁 */
  delay?: number
  disabled?: boolean
  children?: ReactNode
}

export function Tooltip({
  content,
  placement = 'top',
  delay = 100,
  disabled = false,
  children
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  // React 19 的 useRef 必须显式给初始值
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const id = `i-tooltip-${useId()}`

  const show = () => {
    if (disabled) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(true), delay)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setVisible(false)
  }

  return (
    <span
      className="i-tooltip"
      onMouseEnter={show}
      onMouseLeave={hide}
      // 同时响应 focus：键盘用户 Tab 过来也要能看到提示
      onFocus={show}
      onBlur={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}
    >
      <span className="i-tooltip__trigger" aria-describedby={visible ? id : undefined}>
        {children}
      </span>
      {visible && content && (
        <span id={id} className={`i-tooltip__pop is-${placement}`} role="tooltip">
          {content}
        </span>
      )}
    </span>
  )
}
