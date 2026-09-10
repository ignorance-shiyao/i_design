import { useEffect, useRef, useState, type ReactNode } from 'react'
import { backTopFrame, shouldShowBackTop } from '@i-design/common'
import { Icon } from './Icon'

export interface BackTopProps {
  children?: ReactNode
  /** 滚过多少像素才露出来。不传则用一屏高 */
  threshold?: number
  /** 回顶动画时长 */
  duration?: number
  className?: string
}

export function BackTop({ children, threshold, duration = 320, className = '' }: BackTopProps) {
  const [visible, setVisible] = useState(false)
  const frame = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      if (frame.current) return
      frame.current = requestAnimationFrame(() => {
        frame.current = 0
        setVisible(shouldShowBackTop(window.scrollY, window.innerHeight, threshold))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [threshold])

  /*
   * 自己算每一帧，而不是 scrollTo({ behavior: 'smooth' })。
   * 后者的时长由浏览器按距离决定，长页面上会滚十几秒，用户以为卡住了；
   * 这里按固定时长走完，页面再长也一样快。
   */
  function toTop() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, 0)
      return
    }
    const from = window.scrollY
    const started = performance.now()
    const step = (now: number) => {
      const y = backTopFrame(from, now - started, duration)
      window.scrollTo(0, y)
      if (y > 0) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  if (!visible) return null

  return (
    <button
      className={['i-backtop', className].filter(Boolean).join(' ')}
      type="button"
      aria-label="回到顶部"
      onClick={toTop}
    >
      {children ?? <Icon name="chevron-up" size={18} />}
    </button>
  )
}
