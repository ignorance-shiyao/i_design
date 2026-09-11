import { useMemo, useRef, useState, type TouchEvent } from 'react'
import { activeIndexAt, groupByIndex } from '@i-design/common'
import { Cell } from './Cell'

export interface IndexesItem {
  key: string
  label: string
  description?: string
}

export interface IndexesProps {
  items: IndexesItem[]
  onSelect?: (item: IndexesItem) => void
}

/**
 * 索引列表。分组与定位的规则在 logic/indexes：
 * 中文转拼音由调用方给 key，组件不替它决定用哪套词库。
 */
export function Indexes({ items, onSelect }: IndexesProps) {
  const groups = useMemo(() => groupByIndex(items, (item) => item.key), [items])
  const [active, setActive] = useState('')
  const [hint, setHint] = useState('')
  const root = useRef<HTMLDivElement>(null)

  const onScroll = () => {
    const el = root.current
    if (!el) return
    const offsets = [...el.querySelectorAll<HTMLElement>('[data-index]')].map((node) => ({
      index: node.dataset.index!,
      top: node.offsetTop
    }))
    setActive(activeIndexAt(offsets, el.scrollTop))
  }

  const jump = (index: string) => {
    const el = root.current
    const target = el?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    if (!el || !target) return
    el.scrollTop = target.offsetTop
    setActive(index)
  }

  /* 手指压住索引条滑动：中途一直跟着跳，松手才收起提示 */
  const onBarMove = (event: TouchEvent) => {
    const touch = event.touches[0]
    const node = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
    const letter = node?.dataset?.letter
    if (!letter || letter === hint) return
    setHint(letter)
    jump(letter)
  }

  return (
    <div className="i-indexes">
      <div className="i-indexes__scroll" ref={root} onScroll={onScroll}>
        {groups.map((group) => (
        <div key={group.index}>
          <p className="i-indexes__title" data-index={group.index}>
            {group.index}
          </p>
          {/* 行本身就是 Cell：手抄一遍它的类名，改动 Cell 时这里不会跟着变 */}
            {group.items.map((item) => (
              <Cell
                key={item.label}
                title={item.label}
                description={item.description}
                onClick={() => onSelect?.(item)}
              />
            ))}
          </div>
        ))}
      </div>

      <nav
        className="i-indexes__bar"
        aria-label="索引"
        onTouchStart={onBarMove}
        onTouchMove={onBarMove}
        onTouchEnd={() => setHint('')}
        onTouchCancel={() => setHint('')}
      >
        {groups.map((group) => (
          <span
            key={group.index}
            className={['i-indexes__letter', active === group.index ? 'is-active' : '']
              .filter(Boolean)
              .join(' ')}
            data-letter={group.index}
            onClick={() => jump(group.index)}
          >
            {group.index}
          </span>
        ))}
      </nav>

      {/* 手指压住索引条时，那个字母正好被手挡住，因此在屏幕中央再显示一次 */}
      {hint && (
        <div className="i-indexes__hint" aria-hidden="true">
          {hint}
        </div>
      )}
    </div>
  )
}
