import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon } from '@i-design/react'

export interface NoticeBarProps {
  text: string
  type?: 'warning' | 'info' | 'danger'
  closable?: boolean
  /** 内容超出时横向滚动；不滚的长文案会被截断，用户读不到后半句 */
  scrollable?: boolean
  /** 滚动速度：像素每秒 */
  speed?: number
  onClose?: () => void
  className?: string
}

export function NoticeBar({
  text,
  type = 'warning',
  closable = false,
  scrollable = true,
  speed = 50,
  onClose,
  className = ''
}: NoticeBarProps) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLSpanElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const [duration, setDuration] = useState(12)

  /** 只有真的放不下才滚动：够放还滚，是没必要的动效 */
  useEffect(() => {
    if (!box.current || !inner.current) return
    setOverflowing(inner.current.scrollWidth > box.current.clientWidth)
    setDuration(Math.max(6, inner.current.scrollWidth / speed))
  }, [text, speed])

  const icon = type === 'danger' ? 'error-circle' : type === 'info' ? 'info-circle' : 'warning-triangle'

  return (
    <div
      className={[
        'i-notice-bar',
        `i-notice-bar--${type}`,
        scrollable && overflowing ? 'is-scrolling' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--i-notice-duration': `${duration}s` } as CSSProperties}
      role="status"
    >
      <Icon name={icon} size={16} />
      <div ref={box} className="i-notice-bar__content">
        <span ref={inner} className="i-notice-bar__text">
          {text}
        </span>
      </div>
      {closable && (
        <button className="i-notice-bar__close" aria-label="关闭" onClick={onClose}>
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  )
}
