import type { ReactNode } from 'react'

export interface BadgeProps {
  count?: number
  max?: number
  dot?: boolean
  showZero?: boolean
  type?: 'brand' | 'success' | 'warning' | 'danger'
  children?: ReactNode
}

export function Badge({
  count = 0,
  max = 99,
  dot = false,
  showZero = false,
  type = 'danger',
  children
}: BadgeProps) {
  const visible = dot || count > 0 || (count === 0 && showZero)
  const text = count > max ? `${max}+` : String(count)

  return (
    <span className="i-badge">
      {children}
      {visible && (
        <span
          className={[
            'i-badge__mark',
            `i-badge--${type}`,
            dot ? 'is-dot' : '',
            children ? 'is-fixed' : ''
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={dot ? '有新内容' : `${count} 条`}
        >
          {!dot && text}
        </span>
      )}
    </span>
  )
}
