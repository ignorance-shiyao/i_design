import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

export interface SwipeAction {
  text: string
  /** danger 用于删除这类不可逆操作 */
  type?: 'default' | 'brand' | 'danger'
}

export interface SwipeCellProps {
  actions: SwipeAction[]
  disabled?: boolean
  onAction?: (action: SwipeAction, index: number) => void
  children?: ReactNode
  className?: string
}

/**
 * 左滑出操作的单元格。
 * 操作藏在手势后面，因此不能承载唯一入口——不是所有用户都知道可以滑。
 */
export function SwipeCell({ actions, disabled = false, onAction, children, className = '' }: SwipeCellProps) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef({ x: 0, offset: 0 })

  // 操作区总宽度：每个按钮 72px
  const max = actions.length * 72

  function onDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled) return
    setDragging(true)
    start.current = { x: event.clientX, offset }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    // 只允许左滑露出操作，右滑到 0 为止
    setOffset(Math.min(0, Math.max(-max, start.current.offset + (event.clientX - start.current.x))))
  }

  function onUp() {
    if (!dragging) return
    setDragging(false)
    // 松手后吸附：停在中间会让用户以为卡住了
    setOffset((current) => (current < -max / 2 ? -max : 0))
  }

  return (
    <div className={['i-swipe-cell', dragging ? 'is-dragging' : '', className].filter(Boolean).join(' ')}>
      <div className="i-swipe-cell__actions">
        {actions.map((action, index) => (
          <button
            key={action.text}
            className={[
              'i-swipe-cell__action',
              action.type && action.type !== 'default' ? `i-swipe-cell__action--${action.type}` : ''
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              setOffset(0)
              onAction?.(action, index)
            }}
          >
            {action.text}
          </button>
        ))}
      </div>

      <div
        className="i-swipe-cell__content"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {children}
      </div>
    </div>
  )
}
