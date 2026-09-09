import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { resolveOverlay, type Placement } from '@i-design/common'

export interface UseOverlayPositionOptions {
  placement: () => Placement
  align?: () => 'center' | 'start'
  offset?: number
  /** 点击浮层与触发器之外时关闭；Tooltip 靠移出关闭，不需要 */
  closeOnOutsideClick?: boolean
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
  triggerEl: Ref<HTMLElement | undefined>,
  popupEl: Ref<HTMLElement | undefined>,
  visible: Ref<boolean>,
  options: UseOverlayPositionOptions,
  onOutsideClick?: () => void
) {
  const pos = ref({ x: 0, y: 0, placement: options.placement(), arrow: 0 })

  async function place() {
    await new Promise(requestAnimationFrame)
    const t = triggerEl.value?.getBoundingClientRect()
    const el = popupEl.value
    if (!t || !el) return
    /*
     * 浮层尺寸用 offsetWidth/offsetHeight，而不是 getBoundingClientRect：
     * 出现动画带 scale，用外接矩形会量到缩放中的尺寸，
     * 于是按偏小的宽度算中心，浮层最终停在偏移几像素的位置。
     */
    pos.value = resolveOverlay({
      trigger: t,
      popup: { x: 0, y: 0, width: el.offsetWidth, height: el.offsetHeight },
      viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
      placement: options.placement(),
      align: options.align?.(),
      offset: options.offset
    })
  }

  function handleDocumentClick(event: MouseEvent) {
    const target = event.target as Node
    if (triggerEl.value?.contains(target) || popupEl.value?.contains(target)) return
    onOutsideClick?.()
  }

  function detach() {
    window.removeEventListener('scroll', place, true)
    window.removeEventListener('resize', place)
    document.removeEventListener('click', handleDocumentClick)
  }

  watch(visible, (open) => {
    if (open) {
      place()
      // 滚动与缩放都会让算好的位置失效；passive 避免拖累滚动性能
      window.addEventListener('scroll', place, { passive: true, capture: true })
      window.addEventListener('resize', place)
      if (options.closeOnOutsideClick) document.addEventListener('click', handleDocumentClick)
    } else {
      detach()
    }
  })

  onBeforeUnmount(detach)

  return { pos, place }
}

/** 箭头是 8px 见方的方块，要以中心对准触发元素中心，因此减 4 */
export function arrowStyle(pos: { placement: Placement; arrow: number }) {
  return pos.placement === 'top' || pos.placement === 'bottom'
    ? { left: `${pos.arrow - 4}px` }
    : { top: `${pos.arrow - 4}px` }
}
