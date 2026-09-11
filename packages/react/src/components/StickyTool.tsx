import { Icon } from './Icon'
import type { IconName } from '@i-design/common'

export interface StickyToolItem {
  value: string
  label: string
  icon: IconName
  disabled?: boolean
}

export interface StickyToolProps {
  items: StickyToolItem[]
  placement?: 'right' | 'left'
  /** 当前高亮项，用于「正在使用的入口」这类状态 */
  active?: string
  onItemClick?: (item: StickyToolItem) => void
}

export function StickyTool({
  items,
  placement = 'right',
  active = '',
  onItemClick
}: StickyToolProps) {
  return (
    // nav 而不是 div：它是一组并列的入口，读屏要能整体跳过去
    <nav className={`i-sticky-tool i-sticky-tool--${placement}`} aria-label="快捷入口">
      {items.map((item) => (
        <button
          key={item.value}
          className={['i-sticky-tool__item', active === item.value ? 'is-active' : '']
            .filter(Boolean)
            .join(' ')}
          type="button"
          disabled={item.disabled}
          aria-current={active === item.value ? 'true' : undefined}
          onClick={() => onItemClick?.(item)}
        >
          <Icon name={item.icon} size={18} />
          {/* 图标之外始终给文字：图标不是所有人都能一眼认出来，窄屏才隐藏 */}
          <span className="i-sticky-tool__label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
