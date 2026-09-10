import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { activeIndex, groupByIndex, indexAt } from '@i-design/common'

export interface IndexBarProps {
  items: Record<string, unknown>[]
  /** 从条目里取出用于分组的字段（通常是拼音首字母） */
  indexKey?: string
  labelKey?: string
  height?: number
  className?: string
}

/**
 * 索引栏。
 *
 * 分组顺序与手指命中都来自 logic/indexbar：「#」排最后、按格命中而非按最近，
 * 这两条各端一旦自己实现就会出现两种表现。
 */
export function IndexBar({
  items,
  indexKey = 'index',
  labelKey = 'label',
  height = 360,
  className = ''
}: IndexBarProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const offsets = useRef<number[]>([])
  const [active, setActive] = useState(0)
  /** 手指按在字母条上时才显示的大字提示 */
  const [hint, setHint] = useState<string | null>(null)

  const groups = useMemo(
    () => groupByIndex(items, (item) => String(item[indexKey] ?? '')),
    [items, indexKey]
  )

  const measure = useCallback(() => {
    const el = scroller.current
    if (!el) return
    offsets.current = groups.map((group) => {
      const node = el.querySelector<HTMLElement>(`[data-index="${group.key}"]`)
      return node ? node.offsetTop : 0
    })
  }, [groups])

  useEffect(measure, [measure])

  const onScroll = useCallback(() => {
    if (!offsets.current.length) measure()
    setActive(activeIndex(offsets.current, scroller.current?.scrollTop ?? 0))
  }, [measure])

  const jump = useCallback(
    (index: number) => {
      const el = scroller.current
      if (!el || index < 0 || index >= groups.length) return
      setActive(index)
      setHint(groups[index].key)
      el.scrollTop = offsets.current[index] ?? 0
    },
    [groups]
  )

  /*
   * 用「落在哪一格」而不是「离哪个字母最近」：
   * 最近判定在两格交界处会来回跳，手指几乎没动、列表却在两个分组之间反复横跳。
   */
  const onBarTouch = useCallback(
    (event: React.TouchEvent) => {
      const rect = bar.current?.getBoundingClientRect()
      if (!rect) return
      if (event.cancelable) event.preventDefault()
      jump(indexAt(event.touches[0].clientY - rect.top, rect.height, groups.length))
    },
    [groups.length, jump]
  )

  const clearHint = useCallback(() => setHint(null), [])

  return (
    <div className={`i-indexbar ${className}`.trim()} style={{ height }}>
      <div ref={scroller} className="i-indexbar__scroll" onScroll={onScroll}>
        {groups.map((group) => (
          <div key={group.key}>
            <div className="i-indexbar__title" data-index={group.key}>
              {group.key}
            </div>
            {group.items.map((item, i) => (
              <div key={i} className="i-indexbar__item">
                {String(item[labelKey] ?? '')}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/*
        字母条是 aria-hidden 的：它是给手指用的快捷入口，读屏使用者靠分组标题
        本身就能导航，把 26 个单字母再念一遍只会把列表淹掉。
      */}
      <div
        ref={bar}
        className="i-indexbar__bar"
        aria-hidden="true"
        onTouchStart={onBarTouch}
        onTouchMove={onBarTouch}
        onTouchEnd={clearHint}
        onTouchCancel={clearHint}
      >
        {groups.map((group, i) => (
          <span
            key={group.key}
            className={`i-indexbar__letter${i === active ? ' is-active' : ''}`}
            onClick={() => jump(i)}
          >
            {group.key}
          </span>
        ))}
      </div>

      {/* 手指按住时的大字提示：字母条本身太窄，手指正好盖住自己点的那个字母 */}
      {hint && <div className="i-indexbar__hint">{hint}</div>}
    </div>
  )
}
