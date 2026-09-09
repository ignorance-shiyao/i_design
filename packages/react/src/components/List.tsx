import type { ReactNode } from 'react'

export interface ListItem {
  title: string
  description?: string
  /** 附加信息，如时间、作者 */
  meta?: string[]
  disabled?: boolean
}

export interface ListProps {
  items: ListItem[]
  /** 去掉外框与底色，用于嵌在卡片里 */
  plain?: boolean
  header?: string
  footer?: string
  clickable?: boolean
  onSelect?: (item: ListItem, index: number) => void
  renderMedia?: (item: ListItem, index: number) => ReactNode
  renderExtra?: (item: ListItem, index: number) => ReactNode
  className?: string
}

/** 与 Table 的分工：表格用于横向比较字段，列表用于逐条阅读 */
export function List({
  items,
  plain = false,
  header = '',
  footer = '',
  clickable = false,
  onSelect,
  renderMedia,
  renderExtra,
  className = ''
}: ListProps) {
  return (
    <div className={['i-list', plain ? 'i-list--plain' : '', className].filter(Boolean).join(' ')}>
      {header && <div className="i-list__header">{header}</div>}

      {items.map((item, index) => (
        <div
          key={item.title + index}
          className={['i-list__item', clickable && !item.disabled ? 'is-clickable' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => clickable && !item.disabled && onSelect?.(item, index)}
        >
          {renderMedia && <div className="i-list__media">{renderMedia(item, index)}</div>}

          <div className="i-list__body">
            <div className="i-list__title">{item.title}</div>
            {item.description && <div className="i-list__desc">{item.description}</div>}
            {item.meta && item.meta.length > 0 && (
              <div className="i-list__meta">
                {item.meta.map((meta) => (
                  <span key={meta}>{meta}</span>
                ))}
              </div>
            )}
          </div>

          {renderExtra && <div className="i-list__extra">{renderExtra(item, index)}</div>}
        </div>
      ))}

      {footer && <div className="i-list__footer">{footer}</div>}
    </div>
  )
}
