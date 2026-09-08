import type { ReactNode } from 'react'

export interface SpaceProps {
  direction?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'between'
  wrap?: boolean
  /** 占满一行；默认是行内元素 */
  block?: boolean
  className?: string
  children?: ReactNode
}

/** 把「相邻元素间距」收敛到令牌上，避免各处手写 margin 长出十几种间距 */
export function Space({
  direction = 'horizontal',
  size = 'md',
  align = 'start',
  wrap = false,
  block = false,
  className = '',
  children
}: SpaceProps) {
  return (
    <div
      className={[
        'i-space',
        `i-space--${direction}`,
        `i-space--${size}`,
        `i-space--${align}`,
        wrap ? 'is-wrap' : '',
        block ? 'is-block' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
