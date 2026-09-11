import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { rafThrottle, scrollThumb, scrollTopOfThumb } from '@i-design/common'

export interface ScrollbarProps {
  height?: string
  maxHeight?: string
  /** 一直显示滚动条，而不是悬停时才出现 */
  always?: boolean
  children?: ReactNode
  className?: string
}

/**
 * 自绘滚动条。
 *
 * Windows 的系统滚动条是一条 17px 宽的灰槽，会把右侧内容挤窄，而 macOS 上默认不占位——
 * 同一份布局在两个系统上看到的宽度不一样。滚动本身仍交给浏览器，我们只是另画一条。
 */
export function Scrollbar({
  height,
  maxHeight,
  always = false,
  children,
  className = ''
}: ScrollbarProps) {
  const view = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState({ scrollTop: 0, clientHeight: 0, scrollHeight: 0 })
  const [trackLength, setTrackLength] = useState(0)
  const [dragging, setDragging] = useState(false)

  const measure = useCallback(() => {
    const el = view.current
    if (!el) return
    setMetrics({
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight
    })
    setTrackLength(track.current?.clientHeight ?? 0)
  }, [])

  /* 合并到每帧一次：滚动事件远多于帧，而这里每次都要读三个布局值 */
  const onScroll = useMemo(() => rafThrottle(measure), [measure])

  useEffect(() => {
    measure()
    const el = view.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // 内容高度变化同样要重算：子节点增减不会触发容器的 resize
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => {
      observer.disconnect()
      onScroll.cancel()
    }
  }, [measure, onScroll])

  const thumb = scrollThumb(metrics, trackLength)

  const drag = useRef({ y: 0, offset: 0 })

  const onThumbDown = (event: ReactPointerEvent) => {
    event.stopPropagation()
    setDragging(true)
    drag.current = { y: event.clientY, offset: thumb.offset }

    const onMove = (move: PointerEvent) => {
      const el = view.current
      if (!el) return
      const offset = drag.current.offset + (move.clientY - drag.current.y)
      el.scrollTop = scrollTopOfThumb(offset, thumb.size, trackLength, metrics)
    }
    const onUp = () => {
      setDragging(false)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  /* 点轨道空白处：跳到对应位置，而不是翻一页——手指点哪就去哪更符合直觉 */
  const onTrackDown = (event: ReactPointerEvent) => {
    if (event.target !== track.current || !view.current || !track.current) return
    const rect = track.current.getBoundingClientRect()
    const offset = event.clientY - rect.top - thumb.size / 2
    view.current.scrollTop = scrollTopOfThumb(offset, thumb.size, trackLength, metrics)
  }

  return (
    <div
      className={['i-scrollbar', dragging ? 'is-dragging' : '', always ? 'is-always' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ height, maxHeight }}
    >
      <div ref={view} className="i-scrollbar__view" style={{ maxHeight }} onScroll={onScroll}>
        {children}
      </div>

      <div
        ref={track}
        className="i-scrollbar__track"
        onPointerDown={onTrackDown}
      >
        <div
          className="i-scrollbar__thumb"
          hidden={!thumb.visible}
          style={{ height: thumb.size, transform: `translateY(${thumb.offset}px)` }}
          onPointerDown={onThumbDown}
        />
      </div>
    </div>
  )
}
