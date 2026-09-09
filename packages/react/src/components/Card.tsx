import type { ReactNode } from 'react'

export interface CardProps {
  title?: string
  header?: ReactNode
  footer?: ReactNode
  hoverable?: boolean
  bordered?: boolean
  className?: string
  children?: ReactNode
}

export function Card({
  title = '',
  header,
  footer,
  hoverable = false,
  bordered = true,
  className = '',
  children
}: CardProps) {
  const classes = [
    'i-card',
    hoverable ? 'is-hoverable' : '',
    bordered ? 'is-bordered' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {(title || header) && (
        <div className="i-card__header">{header ?? <h3 className="i-card__title">{title}</h3>}</div>
      )}
      <div className="i-card__body">{children}</div>
      {footer && <div className="i-card__footer">{footer}</div>}
    </div>
  )
}
