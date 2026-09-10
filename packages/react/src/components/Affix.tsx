import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { resolveAffix, type AffixState } from '@i-design/common'

export interface AffixProps {
  children?: ReactNode
  /** 距视口顶部多少像素时吸住 */
  top?: number
  /** 距视口底部多少像素时吸住。与 top 二选一 */
  bottom?: number
  /** 容器选择器：容器滚出视口时元素跟着一起走 */
  container?: string
  onChange?: (affixed: boolean) => void
  className?: string
}

export function Affix({ children, top = 0, bottom, container = '', onChange, className = '' }: AffixProps) {
  const root = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [state, setState] = useState<AffixState>({ mode: 'none', offset: 0 })
  /** 占位高度：吸住时元素脱离文档流，不占位的话下面的内容会往上跳一整块 */
  const [placeholder, setPlaceholder] = useState(0)

  const measure = useCallback(() => {
    frame.current = 0
    const el = root.current
    const holder = el?.firstElementChild as HTMLElement | null
    if (!el || !holder) return

    const rect = el.getBoundingClientRect()
    const height = holder.offsetHeight
    const box = container ? document.querySelector(container)?.getBoundingClientRect() : undefined

    const next = resolveAffix(
      {
        offsetTop: rect.top + window.scrollY,
        height,
        scrollTop: window.scrollY,
        viewportHeight: window.innerHeight,
        containerBottom: box ? box.bottom + window.scrollY : undefined
      },
      { top: bottom === undefined ? top : undefined, bottom }
    )

    setState((prev) => {
      if (prev.mode !== next.mode) onChange?.(next.mode !== 'none')
      return next
    })
    setPlaceholder(next.mode === 'none' ? 0 : height)
  }, [top, bottom, container, onChange])

  useEffect(() => {
    /* 滚动事件合并到 rAF：每帧最多量一次布局，不然长页面上滚动会明显发涩 */
    const onScroll = () => {
      if (frame.current) return
      frame.current = requestAnimationFrame(measure)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    measure()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [measure])

  const style =
    state.mode === 'none'
      ? undefined
      : state.mode === 'top'
        ? { position: 'fixed' as const, top: state.offset, zIndex: 'var(--i-z-sticky)' }
        : { position: 'fixed' as const, bottom: state.offset, zIndex: 'var(--i-z-sticky)' }

  return (
    /*
      外层始终留在文档流里并撑出占位高度。
      吸住时内层脱离文档流，不占位的话下面的内容会整块往上跳一次——
      那一跳正好发生在用户滚动时，看起来像页面抖了一下。
    */
    <div
      ref={root}
      className={['i-affix', className].filter(Boolean).join(' ')}
      style={{ height: placeholder || undefined }}
    >
      <div
        className={['i-affix__inner', state.mode !== 'none' ? 'is-affixed' : ''].filter(Boolean).join(' ')}
        style={style}
      >
        {children}
      </div>
    </div>
  )
}
