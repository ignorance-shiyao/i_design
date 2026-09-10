import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
  type ReactNode
} from 'react'
import {
  dotRange,
  nextIndex,
  resolveSwipe,
  rubberBand,
  shouldAutoplay,
  trackOffset
} from '@i-design/common'
import { Icon } from './Icon'

export interface CarouselItem {
  key: string
  label?: string
}

export interface CarouselProps {
  /** 每一张的说明，同时用作读屏文案与缺省占位 */
  items: CarouselItem[]
  index?: number
  onIndexChange?: (index: number) => void
  /** 自动播放间隔（毫秒）；0 表示不自动播放 */
  interval?: number
  loop?: boolean
  height?: number
  /** 指示点最多显示几个，超出就只显示当前页附近的一段 */
  maxDots?: number
  /** 显示左右箭头。触摸端通常关掉，手势本身就够了 */
  arrows?: boolean
  renderItem?: (item: CarouselItem, index: number) => ReactNode
  className?: string
}

export function Carousel({
  items,
  index: controlled,
  onIndexChange,
  interval = 0,
  loop = true,
  height = 220,
  maxDots = 7,
  arrows = true,
  renderItem,
  className = ''
}: CarouselProps) {
  const root = useRef<HTMLElement>(null)
  const [uncontrolled, setUncontrolled] = useState(0)
  const index = controlled ?? uncontrolled
  const [width, setWidth] = useState(0)
  const [drag, setDrag] = useState<{ startX: number; dx: number; at: number } | null>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [documentHidden, setDocumentHidden] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const count = items.length
  const dots = dotRange(index, count, maxDots)

  const setIndex = useCallback(
    (next: number) => {
      setUncontrolled(next)
      onIndexChange?.(next)
    },
    [onIndexChange]
  )

  const go = useCallback(
    (delta: number) => setIndex(nextIndex(index, count, delta, loop)),
    [index, count, loop, setIndex]
  )

  /*
   * 轨道位移。拖动时把手指位移折算成小数张，每一帧都跟手；
   * 松手后落到整数张，由 CSS 过渡收尾。
   */
  const offset = rubberBand(trackOffset(index, drag?.dx ?? 0, width), count, loop)

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (count <= 1) return
    setDrag({ startX: event.clientX, dx: 0, at: Date.now() })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    setDrag((d) => (d ? { ...d, dx: event.clientX - d.startX } : d))
  }

  function onPointerUp() {
    if (!drag) return
    // 位移与速度任一达标就翻页：只看位移会把手机上最自然的短促轻扫判成「没划够」
    const direction = resolveSwipe(drag.dx, width, Date.now() - drag.at)
    setDrag(null)
    if (direction) go(direction)
  }

  /*
   * 自动播放。用一次性的 timeout 而不是 setInterval：
   * interval 型定时器在页面卡顿后会把攒下的几次一起补发，画面会连翻好几张。
   */
  useEffect(() => {
    const playing = shouldAutoplay({
      enabled: interval > 0,
      count,
      hovered,
      focused,
      dragging: !!drag,
      documentHidden,
      reducedMotion
    })
    if (!playing) return
    const timer = setTimeout(() => go(1), interval)
    return () => clearTimeout(timer)
  }, [interval, count, hovered, focused, drag, documentHidden, reducedMotion, index, go])

  useEffect(() => {
    const measure = () => setWidth(root.current?.getBoundingClientRect().width ?? 0)
    measure()
    const observer = new ResizeObserver(measure)
    if (root.current) observer.observe(root.current)

    const onVisibility = () => setDocumentHidden(document.hidden)
    setDocumentHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(query.matches)
    const onQuery = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    query.addEventListener('change', onQuery)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      query.removeEventListener('change', onQuery)
    }
  }, [])

  function onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(1)
    }
  }

  const atStart = !loop && index === 0
  const atEnd = !loop && index === count - 1

  return (
    // roledescription 而不是 role="region"：读屏会念出「轮播」，
    // 使用者才知道左右方向键在这里是有意义的
    <section
      ref={root}
      className={['i-carousel', className].filter(Boolean).join(' ')}
      role="group"
      aria-roledescription="轮播"
      style={{ height }}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div
        className={['i-carousel__track', drag ? 'is-dragging' : ''].filter(Boolean).join(' ')}
        style={{ transform: `translate3d(${-offset * 100}%, 0, 0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {items.map((item, i) => (
          <div
            key={item.key}
            className="i-carousel__slide"
            role="group"
            aria-roledescription="幻灯片"
            aria-label={item.label || `第 ${i + 1} 张`}
            aria-hidden={i !== index}
          >
            {renderItem ? renderItem(item, i) : <div className="i-carousel__placeholder">{item.label}</div>}
          </div>
        ))}
      </div>

      {arrows && count > 1 && (
        <>
          <button
            className="i-carousel__arrow i-carousel__arrow--prev"
            aria-label="上一张"
            disabled={atStart}
            onClick={() => go(-1)}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            className="i-carousel__arrow i-carousel__arrow--next"
            aria-label="下一张"
            disabled={atEnd}
            onClick={() => go(1)}
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </>
      )}

      {/*
        指示点是按钮而不是装饰：它们可点、可聚焦，读屏也要能念出「第 3 张，共 12 张」。
        纯 div 加个 onClick 的做法用键盘完全够不着。
      */}
      {count > 1 && (
        <div className="i-carousel__dots">
          {dots.items.map((dot) => (
            <button
              key={dot}
              className={['i-carousel__dot', dot === dots.active ? 'is-active' : ''].filter(Boolean).join(' ')}
              aria-label={`第 ${dot + 1} 张，共 ${count} 张`}
              aria-current={dot === dots.active}
              onClick={() => setIndex(Math.min(count - 1, Math.max(0, dot)))}
            />
          ))}
        </div>
      )}
    </section>
  )
}
