import { useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Placement } from '@i-design/common'
import { arrowStyle, useOverlayPosition } from '../useOverlayPosition'

export interface TooltipProps {
  content?: ReactNode
  placement?: Placement
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
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const popupRef = useRef<HTMLSpanElement | null>(null)
  const id = `i-tooltip-${useId()}`

  // 提示不需要点击外部关闭：它靠移出触发元素消失
  const { pos } = useOverlayPosition(triggerRef, popupRef, visible, { placement, offset: 6 })

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
    <>
      <span
        ref={triggerRef}
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
      </span>

      {visible &&
        !!content &&
        createPortal(
          <span
            id={id}
            ref={popupRef}
            className={`i-tooltip__pop is-${pos.placement}`}
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            role="tooltip"
          >
            <span className="i-tooltip__arrow" style={arrowStyle(pos)} />
            {content}
          </span>,
          document.body
        )}
    </>
  )
}
