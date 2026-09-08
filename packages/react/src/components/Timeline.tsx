export interface TimelineItem {
  title: string
  time?: string
  description?: string
  type?: 'brand' | 'success' | 'warning' | 'danger' | 'muted'
  /** 正在发生：圆点填实 */
  current?: boolean
}

export interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

/** 与 Steps 的分工：Steps 描述还没走完的流程，Timeline 记录已经发生的事 */
export function Timeline({ items, className = '' }: TimelineProps) {
  return (
    <div className={['i-timeline', className].filter(Boolean).join(' ')}>
      {items.map((item, index) => (
        <div
          key={item.title + index}
          className={[
            'i-timeline__item',
            item.type ? `i-timeline__item--${item.type}` : '',
            item.current ? 'is-current' : ''
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="i-timeline__rail">
            <span className="i-timeline__dot" />
            <span className="i-timeline__line" />
          </div>
          <div className="i-timeline__content">
            <div className="i-timeline__title">{item.title}</div>
            {item.time && <div className="i-timeline__time">{item.time}</div>}
            {item.description && <div className="i-timeline__desc">{item.description}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
