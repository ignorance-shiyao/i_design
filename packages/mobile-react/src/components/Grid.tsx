import type { CSSProperties } from 'react'
import { Icon } from '@i-design/react'
import type { IconName } from '@i-design/common'

export interface GridItem {
  label: string
  icon: IconName
  value?: string
}

export interface GridProps {
  items: GridItem[]
  columns?: number
  /** 格子之间画分隔线 */
  bordered?: boolean
  onSelect?: (item: GridItem, index: number) => void
  className?: string
}

/** 图标在上文字在下：横排图文在小屏上一行放不下三个以上 */
export function Grid({ items, columns = 4, bordered = false, onSelect, className = '' }: GridProps) {
  return (
    <div
      className={['i-grid', bordered ? 'i-grid--bordered' : '', className].filter(Boolean).join(' ')}
      style={{ '--i-grid-columns': columns } as CSSProperties}
    >
      {items.map((item, index) => (
        <button key={item.label} className="i-grid__item" onClick={() => onSelect?.(item, index)}>
          <span className="i-grid__icon">
            <Icon name={item.icon} size={20} />
          </span>
          <span className="i-grid__text">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
