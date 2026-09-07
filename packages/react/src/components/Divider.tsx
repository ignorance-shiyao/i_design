import type { ReactNode } from 'react'

export interface DividerProps {
  direction?: 'horizontal' | 'vertical'
  align?: 'left' | 'center' | 'right'
  dashed?: boolean
  children?: ReactNode
}

export function Divider({
  direction = 'horizontal',
  align = 'center',
  dashed = false,
  children
}: DividerProps) {
  const classes = [
    'i-divider',
    `i-divider--${direction}`,
    `is-${align}`,
    dashed ? 'is-dashed' : '',
    children ? 'has-text' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} role="separator">
      {children && direction === 'horizontal' && <span className="i-divider__text">{children}</span>}
    </div>
  )
}
