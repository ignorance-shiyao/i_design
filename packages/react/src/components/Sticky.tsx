import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { resolveAffix, type AffixState } from '@i-design/common'

export interface StickyProps {
  children?: ReactNode
  /** 距容器顶部多少像素时吸住 */
  top?: number
  /** 滚动容器选择器。不传则用最近的可滚动祖先 */
  container?: string
  onChange?: (stuck: boolean) => void
  className?: string
}

/** 找最近的可滚动祖先：容器没写死时，组件应当自己认出该跟谁走 */
function findScroller(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node) {
    const overflow = getComputedStyle(node).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return node
    node = node.parentElement
  }
  return null
}

/**
 * 吸顶。
 *
 * 吸附交给浏览器原生的 position: sticky——它自己占位、自己在容器边界内停住，
 * 没有一帧延迟，也不会在快速滚动时抖。自己用 fixed 加占位去模拟只会更差。
 * 这里的 JS 只负责算出「此刻是不是吸住了」，因为 CSS 至今给不出这个答案。
 */
export function Sticky({ children, top = 0, container = '', onChange, className = '' }: StickyProps) {
  const inner = useRef<HTMLDivElement>(null)
  /*
   * 哨兵：一个零高、不吸附的元素，紧挨在吸顶元素前面。
   * 不能去量吸顶元素自己——它吸住之后就永远停在阈值那条线上，
   * 量出来的位置和「刚好要吸住」时一模一样，判定于是恒为「没吸住」。
   */
  const sentinel = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)
  const [state, setState] = useState<AffixState>({ mode: 'none', offset: 0 })

  const measure = useCallback(
    (scroller: HTMLElement) => {
      frame.current = 0
      const holder = inner.current
      const flag = sentinel.current
      if (!holder || !flag) return

      const flagRect = flag.getBoundingClientRect()
      const boxRect = scroller.getBoundingClientRect()
      const next = resolveAffix(
        {
          // 相对容器算，而不是相对文档：容器自己也可能被页面滚走
          offsetTop: flagRect.top - boxRect.top + scroller.scrollTop,
          height: holder.offsetHeight,
          scrollTop: scroller.scrollTop,
          viewportHeight: scroller.clientHeight
        },
        { top }
      )
      setState((prev) => {
        if (prev.mode !== next.mode) onChange?.(next.mode !== 'none')
        return next
      })
    },
    [top, onChange]
  )

  useEffect(() => {
    const scroller = container
      ? document.querySelector<HTMLElement>(container)
      : findScroller(sentinel.current)
    if (!scroller) return
    const onScroll = () => {
      if (frame.current) return
      frame.current = requestAnimationFrame(() => measure(scroller))
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    measure(scroller)
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [container, measure])

  return (
    <div className={['i-sticky', className].filter(Boolean).join(' ')}>
      <span ref={sentinel} className="i-sticky__sentinel" aria-hidden="true" />
      <div
        ref={inner}
        className={['i-sticky__inner', state.mode !== 'none' ? 'is-stuck' : ''].filter(Boolean).join(' ')}
        style={{ top }}
      >
        {children}
      </div>
    </div>
  )
}
