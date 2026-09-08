import { Icon } from '@i-design/react'
import type { IconName } from '@i-design/common'

export interface TabbarItem {
  value: string
  label: string
  icon: IconName
  /** 角标数字；0 或不传则不显示 */
  badge?: number
  /** 只显示一个小红点，用于「有更新」这类无需计数的提示 */
  dot?: boolean
}

export interface TabbarProps {
  value: string
  items: TabbarItem[]
  fixed?: boolean
  onChange?: (value: string) => void
  className?: string
}

export function Tabbar({ value, items, fixed = false, onChange, className = '' }: TabbarProps) {
  return (
    <nav
      className={['i-tabbar', fixed ? 'is-fixed' : '', className].filter(Boolean).join(' ')}
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.value}
          className={['i-tabbar__item', item.value === value ? 'is-active' : ''].filter(Boolean).join(' ')}
          role="tab"
          aria-selected={item.value === value}
          onClick={() => onChange?.(item.value)}
        >
          <span className="i-tabbar__icon">
            <Icon name={item.icon} size={22} />
            {item.badge ? (
              <span className="i-tabbar__badge">{item.badge > 99 ? '99+' : item.badge}</span>
            ) : item.dot ? (
              <span className="i-tabbar__dot" />
            ) : null}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
