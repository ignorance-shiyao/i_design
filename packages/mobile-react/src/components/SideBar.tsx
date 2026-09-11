export interface SideBarItem {
  value: string
  label: string
  /** 角标数字；0 或不传则不显示 */
  badge?: number
  disabled?: boolean
}

export interface SideBarProps {
  value: string
  items: SideBarItem[]
  onChange?: (value: string) => void
}

/**
 * 侧边导航：左边是类目，右边是该类目的内容。
 * 选中项的底色与右侧内容区相同，表达「右边这块属于它」——
 * 不用左侧粗竖线，那是被禁用的状态暗示。
 */
export function SideBar({ value, items, onChange }: SideBarProps) {
  return (
    <nav className="i-side-bar" role="tablist" aria-orientation="vertical">
      {items.map((item) => (
        <button
          key={item.value}
          className={['i-side-bar__item', item.value === value ? 'is-active' : '']
            .filter(Boolean)
            .join(' ')}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          disabled={item.disabled}
          onClick={() => !item.disabled && onChange?.(item.value)}
        >
          {item.label}
          {item.badge ? (
            <span className="i-side-bar__badge">{item.badge > 99 ? '99+' : item.badge}</span>
          ) : null}
        </button>
      ))}
    </nav>
  )
}
