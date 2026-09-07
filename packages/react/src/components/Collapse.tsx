import type { ReactNode } from 'react'
import { Icon } from './Icon'

export interface CollapseItem {
  name: string
  title: string
  content?: ReactNode
  disabled?: boolean
}

export interface CollapseProps {
  value?: string[]
  items: CollapseItem[]
  /** 手风琴：同时只展开一项 */
  accordion?: boolean
  bordered?: boolean
  onChange?: (value: string[]) => void
}

export function Collapse({
  value = [],
  items,
  accordion = false,
  bordered = true,
  onChange
}: CollapseProps) {
  const open = new Set(value)

  const toggle = (item: CollapseItem) => {
    if (item.disabled) return
    const isOpen = open.has(item.name)
    const next = accordion
      ? isOpen
        ? []
        : [item.name]
      : isOpen
        ? value.filter((n) => n !== item.name)
        : [...value, item.name]
    onChange?.(next)
  }

  return (
    <div className={['i-collapse', bordered ? 'is-bordered' : ''].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const isOpen = open.has(item.name)
        return (
          <div
            key={item.name}
            className={['i-collapse__item', isOpen ? 'is-open' : '', item.disabled ? 'is-disabled' : '']
              .filter(Boolean)
              .join(' ')}
          >
            <button
              className="i-collapse__head"
              type="button"
              aria-expanded={isOpen}
              disabled={item.disabled}
              onClick={() => toggle(item)}
            >
              <Icon className="i-collapse__arrow" name="chevron-right" size={15} />
              <span className="i-collapse__title">{item.title}</span>
            </button>
            {/* 用 hidden 而非卸载：保留内容状态，展开时不重新挂载 */}
            <div className="i-collapse__body" hidden={!isOpen}>
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
