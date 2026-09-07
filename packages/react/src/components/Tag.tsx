import type { ReactNode } from 'react'

export interface TagProps {
  type?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
  round?: boolean
  className?: string
  children?: ReactNode
}

export function Tag({ type = 'default', round = false, className = '', children }: TagProps) {
  const classes = ['i-tag', `i-tag--${type}`, round ? 'is-round' : '', className]
    .filter(Boolean)
    .join(' ')
  return <span className={classes}>{children}</span>
}
