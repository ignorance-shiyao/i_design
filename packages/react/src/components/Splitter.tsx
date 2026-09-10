import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { keyboardStep, paneRatio, paneSize, resizePane } from '@i-design/common'

export interface SplitterProps {
  first?: ReactNode
  second?: ReactNode
  /** 第一栏占比 0-1 */
  value?: number
  onChange?: (ratio: number) => void
  direction?: 'horizontal' | 'vertical'
  /** 两栏各自的最小尺寸，像素 */
  minFirst?: number
  minSecond?: number
  maxFirst?: number
  gutter?: number
  className?: string
}

export function Splitter({
  first,
  second,
  value = 0.5,
  onChange,
  direction = 'horizontal',
  minFirst = 120,
  minSecond = 120,
  maxFirst = 0,
  gutter = 4,
  className = ''
}: SplitterProps) {
  const root = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const total = useRef(0)
  const isRow = direction === 'horizontal'

  const measure = useCallback(() => {
    const el = root.current
    if (!el) return
    total.current = isRow ? el.clientWidth : el.clientHeight
  }, [isRow])

  const apply = useCallback(
    (nextSize: number) => {
      const clamped = resizePane(
        total.current,
        nextSize,
        { min: minFirst, max: maxFirst || undefined },
        { min: minSecond },
        gutter
      )
      onChange?.(paneRatio(clamped, total.current, gutter))
    },
    [minFirst, minSecond, maxFirst, gutter, onChange]
  )

  useEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (root.current) observer.observe(root.current)
    return () => observer.disconnect()
  }, [measure])

  function onDown(event: ReactPointerEvent) {
    measure()
    setDragging(true)
    ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
  }

  function onMove(event: ReactPointerEvent) {
    if (!dragging) return
    const rect = root.current?.getBoundingClientRect()
    if (!rect) return
    apply(isRow ? event.clientX - rect.left : event.clientY - rect.top)
  }

  /*
   * 分隔条必须能用键盘拖：它是个真正的控件，不是装饰。
   * 只能鼠标拖的话，用键盘操作的人永远改不了这个布局。
   */
  function onKeyDown(event: ReactKeyboardEvent) {
    const step = keyboardStep(event.key, event.shiftKey)
    if (!step) return
    event.preventDefault()
    measure()
    apply(paneSize(value, total.current, gutter) + step)
  }

  const percent = Math.round(value * 100)

  return (
    <div
      ref={root}
      className={['i-splitter', `i-splitter--${direction}`, dragging ? 'is-dragging' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {/*
        第一栏写死 flex: 0 0 <基准>，不能只给 flex-basis。
        .i-splitter__pane 上有 flex: 1 1 0，两栏都会去分剩余空间，
        于是无论基准算得多准，最终宽度都被平分回去。
      */}
      <div className="i-splitter__pane" style={{ flex: `0 0 calc((100% - ${gutter}px) * ${value})` }}>
        {first}
      </div>

      {/*
        role="separator" 加 aria-valuenow 不是形式：读屏使用者靠它知道
        「现在是三七开」以及自己按方向键改到了多少。
      */}
      <div
        className="i-splitter__gutter"
        role="separator"
        tabIndex={0}
        aria-orientation={isRow ? 'vertical' : 'horizontal'}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`调整分栏比例，当前 ${percent}%`}
        style={{ flexBasis: gutter }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={onKeyDown}
      >
        <span className="i-splitter__grip" />
      </div>

      <div className="i-splitter__pane">{second}</div>
    </div>
  )
}
