import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * 图表按容器的真实宽度设视图坐标，而不是恒定 640。
 *
 * 与 Vue 端的 useChartWidth 同一条规则：viewBox 固定 640 时，SVG 在 358px 宽的
 * 手机上被整体缩到 0.48，11px 的刻度字实际只有 6px——量出来的。而且轴标签的
 * 抽稀按视图宽度算，恒定 640 意味着手机上排了和桌面一样多的标签，缩完糊成一条线。
 *
 * 没有 ResizeObserver 时（SSR、老环境）退回 640，与改动前完全一致。
 */
export function useChartWidth<T extends Element>(
  { min = 320, max = 640 }: { min?: number; max?: number } = {}
): { ref: RefObject<T | null>; width: number } {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(max)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = (px: number) => {
      if (px) setWidth(Math.round(Math.min(max, Math.max(min, px))))
    }
    measure(el.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) measure(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [min, max])

  return { ref, width }
}
