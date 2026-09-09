import type { ReactNode } from 'react'

export interface SkeletonProps {
  loading?: boolean
  variant?: 'text' | 'paragraph' | 'card' | 'list' | 'avatar'
  rows?: number
  animated?: boolean
  children?: ReactNode
}

export function Skeleton({
  loading = true,
  variant = 'paragraph',
  rows = 3,
  animated = true,
  children
}: SkeletonProps) {
  if (!loading) return <>{children}</>

  const classes = ['i-skeleton', animated ? 'is-animated' : ''].filter(Boolean).join(' ')
  // 末行更短，视觉上更接近真实段落
  const widths = Array.from({ length: rows }, (_, i) => (i === rows - 1 ? '62%' : '100%'))

  return (
    <div className={classes} aria-busy="true" aria-live="polite">
      {variant === 'text' && <span className="i-skeleton__bar" style={{ width: '40%' }} />}

      {variant === 'paragraph' &&
        widths.map((w, i) => <span key={i} className="i-skeleton__bar" style={{ width: w }} />)}

      {variant === 'avatar' && (
        <div className="i-skeleton__row">
          <span className="i-skeleton__circle" />
          <div className="i-skeleton__col">
            <span className="i-skeleton__bar" style={{ width: 120 }} />
            <span className="i-skeleton__bar i-skeleton__bar--sm" style={{ width: 180 }} />
          </div>
        </div>
      )}

      {variant === 'list' &&
        Array.from({ length: rows }, (_, i) => (
          <div key={i} className="i-skeleton__row i-skeleton__row--list">
            <span className="i-skeleton__circle" />
            <div className="i-skeleton__col">
              <span className="i-skeleton__bar" style={{ width: '45%' }} />
              <span className="i-skeleton__bar i-skeleton__bar--sm" style={{ width: '75%' }} />
            </div>
          </div>
        ))}

      {variant === 'card' && (
        <>
          <span className="i-skeleton__block" />
          <span className="i-skeleton__bar" style={{ width: '55%' }} />
          <span className="i-skeleton__bar i-skeleton__bar--sm" style={{ width: '85%' }} />
          <span className="i-skeleton__bar i-skeleton__bar--sm" style={{ width: '70%' }} />
        </>
      )}
    </div>
  )
}
