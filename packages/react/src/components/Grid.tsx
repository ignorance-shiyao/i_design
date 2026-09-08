import type { CSSProperties, ReactNode } from 'react'

export interface RowProps {
  /** 列间距（px），由行统一控制 */
  gutter?: number
  align?: 'top' | 'middle' | 'bottom'
  justify?: 'start' | 'center' | 'end' | 'between'
  className?: string
  children?: ReactNode
}

export function Row({
  gutter = 16,
  align = 'top',
  justify = 'start',
  className = '',
  children
}: RowProps) {
  return (
    <div
      className={['i-row', `i-row--${align}`, `i-row--${justify}`, className]
        .filter(Boolean)
        .join(' ')}
      // 间距通过 CSS 变量往下传，列直接读它，不必再走一遍 context
      style={{ '--i-row-gutter': `${gutter}px` } as CSSProperties}
    >
      {children}
    </div>
  )
}

export interface ColProps {
  /** 24 栅格中的跨度 */
  span?: number
  offset?: number
  /** 窄屏（≤768px）下的跨度；默认整行铺满 */
  sm?: number
  /** 不随窄屏变化 */
  keep?: boolean
  /** 占满剩余空间，忽略 span */
  flex?: boolean
  className?: string
  children?: ReactNode
}

export function Col({
  span = 24,
  offset = 0,
  sm = 24,
  keep = false,
  flex = false,
  className = '',
  children
}: ColProps) {
  return (
    <div
      className={[
        'i-col',
        offset > 0 ? 'is-offset' : '',
        keep ? 'is-keep' : '',
        flex ? 'is-flex' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--i-col-span': span,
          '--i-col-span-sm': sm,
          '--i-col-offset': offset
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
