import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { activeAnchor, anchorScrollTop, type AnchorTarget } from '@i-design/common'

export interface AnchorItem {
  key: string
  label: string
  /** 标题层级，用于缩进；2 为一级 */
  level?: number
}

export interface AnchorProps {
  items: AnchorItem[]
  /** 判定线相对视口顶端的偏移，通常等于吸顶导航高度 */
  offset?: number
  onChange?: (key: string) => void
}

export function Anchor({ items, offset = 80, onChange }: AnchorProps) {
  const [active, setActive] = useState('')

  const update = useCallback(() => {
    const targets = items
      .map((item) => {
        const el = document.getElementById(item.key)
        return el ? { key: item.key, top: el.getBoundingClientRect().top + window.scrollY } : null
      })
      .filter((t): t is AnchorTarget => t !== null)

    const next = activeAnchor(targets, {
      scrollTop: window.scrollY,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      offset
    })
    setActive((current) => {
      if (next !== current) onChange?.(next)
      return next
    })
  }, [items, offset, onChange])

  useEffect(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const jump = (key: string, event: MouseEvent) => {
    event.preventDefault()
    const el = document.getElementById(key)
    if (!el) return
    window.scrollTo({
      top: anchorScrollTop(el.getBoundingClientRect().top + window.scrollY, offset),
      behavior: 'smooth'
    })
    // 立即更新高亮：平滑滚动期间不等滚动事件，否则点了半天没反应
    setActive(key)
    onChange?.(key)
  }

  return (
    <nav className="i-anchor" aria-label="页内导航">
      <ul className="i-anchor__list">
        {items.map((item) => (
          <li key={item.key}>
            <a
              className={`i-anchor__link${active === item.key ? ' is-active' : ''}`}
              href={`#${item.key}`}
              data-level={item.level ?? 2}
              aria-current={active === item.key ? 'location' : undefined}
              onClick={(e) => jump(item.key, e)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
