import { useRef } from 'react'
import { moveActiveLoop } from '@i-design/common'
import type { ReactNode } from 'react'

export interface TabItem {
  name: string
  label: string
  disabled?: boolean
}

export interface TabsProps {
  value: string
  items: TabItem[]
  variant?: 'line' | 'card'
  size?: 'sm' | 'md'
  onChange?: (name: string) => void
  children?: ReactNode
}

export function Tabs({ value, items, variant = 'line', size = 'md', onChange, children }: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = items.findIndex((i) => i.name === value)

  const select = (item: TabItem) => {
    if (item.disabled || item.name === value) return
    onChange?.(item.name)
  }

  // 循环移动并跳过禁用项的规则来自公共层；焦点跟随是 WAI-ARIA tabs 模式的要求
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = moveActiveLoop(
      items.map((i) => ({ value: i.name, disabled: i.disabled })),
      activeIndex,
      event.key === 'ArrowRight' ? 1 : -1
    )
    if (next >= 0 && next !== activeIndex) {
      onChange?.(items[next].name)
      requestAnimationFrame(() => refs.current[next]?.focus())
    }
  }

  return (
    <div className={`i-tabs i-tabs--${variant} i-tabs--${size}`}>
      <div className="i-tabs__nav" role="tablist" onKeyDown={onKeyDown}>
        {items.map((item, index) => (
          <button
            key={item.name}
            ref={(el) => { refs.current[index] = el }}
            className={[
              'i-tabs__tab',
              item.name === value ? 'is-active' : '',
              item.disabled ? 'is-disabled' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            type="button"
            role="tab"
            aria-selected={item.name === value}
            tabIndex={item.name === value ? 0 : -1}
            disabled={item.disabled}
            onClick={() => select(item)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="i-tabs__panel" role="tabpanel">{children}</div>
    </div>
  )
}
