import type { ReactNode } from 'react'

export interface DescriptionItem {
  label: string
  value?: ReactNode
  /** 跨列数，用于地址、备注这类长字段 */
  span?: number
}

export interface DescriptionsProps {
  items: DescriptionItem[]
  title?: string
  column?: number
  layout?: 'horizontal' | 'vertical'
  bordered?: boolean
  size?: 'sm' | 'md'
  extra?: ReactNode
}

export function Descriptions({
  items,
  title = '',
  column = 2,
  layout = 'horizontal',
  bordered = true,
  size = 'md',
  extra
}: DescriptionsProps) {
  return (
    <section
      className={['i-desc', `is-${layout}`, `i-desc--${size}`, bordered ? 'is-bordered' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {(title || extra) && (
        <header className="i-desc__head">
          <h3 className="i-desc__title">{title}</h3>
          {extra && <div className="i-desc__extra">{extra}</div>}
        </header>
      )}
      <dl className="i-desc__body" style={{ ['--i-desc-column' as string]: column }}>
        {items.map((item) => (
          <div
            key={item.label}
            className="i-desc__item"
            style={{ gridColumn: `span ${Math.min(item.span ?? 1, column)}` }}
          >
            <dt className="i-desc__label">{item.label}</dt>
            <dd className="i-desc__value">
              {/* 空值显示占位符，否则用户分不清「没有」和「没加载出来」 */}
              {item.value === '' || item.value === undefined || item.value === null ? (
                <span className="i-desc__empty">—</span>
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
