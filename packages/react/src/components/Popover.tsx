import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { rafThrottle, resolveOverlay, type Placement } from '@i-design/common'

export interface PopoverProps {
  title?: string
  content?: ReactNode
  placement?: Placement
  /** 点击触发适合承载可交互内容，悬浮适合纯说明 */
  trigger?: 'click' | 'hover'
  disabled?: boolean
  /**
   * 受控开合。不传时组件自己管；传了则以外部为准——
   * Select、Cascader 这类「选完就该收起」的控件需要在选中时主动关闭。
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: 'center' | 'start'
  children?: ReactNode
}

export function Popover({
  title = '',
  content = null,
  placement = 'top',
  trigger = 'click',
  disabled = false,
  open: openProp,
  onOpenChange,
  align = 'center',
  children
}: PopoverProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [inner, setInner] = useState(false)
  const controlled = openProp !== undefined
  const visible = controlled ? !!openProp : inner
  const setVisible = (next: boolean) => {
    if (!controlled) setInner(next)
    onOpenChange?.(next)
  }
  const [pos, setPos] = useState({ x: 0, y: 0, placement, arrow: 0 })

  // 位置要等浮层挂上去、量得到尺寸之后再算，否则首次打开会落在错误的位置
  const place = useCallback(() => {
    const t = triggerRef.current?.getBoundingClientRect()
    const el = popupRef.current
    if (!t || !el) return
    /*
     * 浮层尺寸用 offsetWidth/offsetHeight，而不是 getBoundingClientRect：
     * 出现动画带 scale(0.97)，用外接矩形会量到缩放中的尺寸，
     * 于是按偏小的宽度算中心，浮层最终停在偏移几像素的位置。
     */
    const p = { x: 0, y: 0, width: el.offsetWidth, height: el.offsetHeight }
    setPos(
      resolveOverlay({
        trigger: t,
        popup: p,
        viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        placement,
        align
      })
    )
  }, [placement, align])

  useEffect(() => {
    if (!visible) return
    place()
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return
      setVisible(false)
    }
    // 滚动与缩放都会让算好的位置失效；重算合并到每帧一次，否则浮层开着时整页滚动都变涩
    const onReposition = rafThrottle(place)
    window.addEventListener('scroll', onReposition, { passive: true, capture: true })
    window.addEventListener('resize', onReposition, { passive: true })
    if (trigger === 'click') document.addEventListener('click', onDocumentClick)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
      document.removeEventListener('click', onDocumentClick)
      onReposition.cancel()
    }
  }, [visible, place, trigger])

  useEffect(() => () => clearTimeout(timer.current), [])

  const open = () => {
    if (disabled) return
    clearTimeout(timer.current)
    setVisible(true)
  }
  // 鼠标从触发元素挪到浮层要经过一段空隙，立即关闭会让浮层点不到
  const delayedClose = () => {
    if (trigger !== 'hover') return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 120)
  }

  const arrowStyle =
    pos.placement === 'top' || pos.placement === 'bottom'
      ? { left: `${pos.arrow - 4}px` }
      : { top: `${pos.arrow - 4}px` }

  return (
    <>
      <span
        ref={triggerRef}
        className="i-overlay-trigger"
        onClick={() => trigger === 'click' && (visible ? setVisible(false) : open())}
        onMouseEnter={() => trigger === 'hover' && open()}
        onMouseLeave={delayedClose}
        onKeyDown={(e) => e.key === 'Escape' && setVisible(false)}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            ref={popupRef}
            className={`i-popover is-${pos.placement}`}
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            role="dialog"
            aria-label={title || undefined}
            onMouseEnter={() => trigger === 'hover' && open()}
            onMouseLeave={delayedClose}
          >
            <span className="i-popover__arrow" style={arrowStyle} />
            {title && <p className="i-popover__title">{title}</p>}
            <div className="i-popover__body">{content}</div>
          </div>,
          document.body
        )}
    </>
  )
}
