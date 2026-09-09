import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { resolveOverlay, type Placement } from '@i-design/common'

export interface UseOverlayPositionOptions {
  placement: Placement
  align?: 'center' | 'start'
  offset?: number
  /** 点击浮层与触发器之外时关闭；Tooltip 靠移出关闭，不需要 */
  closeOnOutsideClick?: boolean
  onOutsideClick?: () => void
}

/**
 * 浮层定位的公共接线。
 *
 * 定位规则本身在 @i-design/common 的 resolveOverlay 里，这里只负责把它接到 DOM 上：
 * 量尺寸、监听滚动与缩放、点击外部关闭。
 * Popover / Dropdown / Tooltip / Popconfirm 共用这一份——四个组件各写一遍，
 * 迟早会有一两个忘记在滚动时重算，表现为「页面一滚，气泡留在原地」。
 */
export function useOverlayPosition(
  triggerRef: RefObject<HTMLElement | null>,
  popupRef: RefObject<HTMLElement | null>,
  visible: boolean,
  options: UseOverlayPositionOptions
) {
  const { placement, align, offset, closeOnOutsideClick, onOutsideClick } = options
  const [pos, setPos] = useState({ x: 0, y: 0, placement, arrow: 0 })
  const outsideRef = useRef(onOutsideClick)
  outsideRef.current = onOutsideClick

  const place = useCallback(() => {
    const t = triggerRef.current?.getBoundingClientRect()
    const el = popupRef.current
    if (!t || !el) return
    /*
     * 浮层尺寸用 offsetWidth/offsetHeight，而不是 getBoundingClientRect：
     * 出现动画带 scale，用外接矩形会量到缩放中的尺寸，
     * 于是按偏小的宽度算中心，浮层最终停在偏移几像素的位置。
     */
    setPos(
      resolveOverlay({
        trigger: t,
        popup: { x: 0, y: 0, width: el.offsetWidth, height: el.offsetHeight },
        viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        placement,
        align,
        offset
      })
    )
  }, [triggerRef, popupRef, placement, align, offset])

  useEffect(() => {
    if (!visible) return
    place()
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return
      outsideRef.current?.()
    }
    // 滚动与缩放都会让算好的位置失效；passive 避免拖累滚动性能
    window.addEventListener('scroll', place, { passive: true, capture: true })
    window.addEventListener('resize', place)
    if (closeOnOutsideClick) document.addEventListener('click', onDocumentClick)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
      document.removeEventListener('click', onDocumentClick)
    }
  }, [visible, place, closeOnOutsideClick, triggerRef, popupRef])

  return { pos, place }
}

/** 箭头是 8px 见方的方块，要以中心对准触发元素中心，因此减 4 */
export function arrowStyle(pos: { placement: Placement; arrow: number }) {
  return pos.placement === 'top' || pos.placement === 'bottom'
    ? { left: `${pos.arrow - 4}px` }
    : { top: `${pos.arrow - 4}px` }
}
