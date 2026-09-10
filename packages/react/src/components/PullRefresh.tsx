import { forwardRef, useCallback, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import {
  PULL_MAX,
  PULL_THRESHOLD,
  pullDistance,
  pullHint,
  pullStatus,
  refreshingOffset,
  shouldRefresh,
  type PullStatus
} from '@i-design/common'
import { Loading } from './Loading'
import { Icon } from './Icon'

export interface PullRefreshProps {
  children?: ReactNode
  /** 拉到这里松手才刷新 */
  threshold?: number
  /** 最多能拉这么远 */
  max?: number
  /** 高度；不传则跟随外层 */
  height?: number
  disabled?: boolean
  onRefresh?: () => void
  className?: string
}

export interface PullRefreshHandle {
  /** 由调用方在数据到位后调用；组件不猜什么时候算刷新完了 */
  finish: () => void
}

/**
 * 下拉刷新。
 *
 * 「拉多远算数、松手停在哪、每个状态说什么」全部来自 logic/pullrefresh，
 * 各端因此是同一种手感——否则同一个 App 里 React 页面拉 40px 就触发、
 * 小程序页面要拉 120px，用起来不像一个东西。
 */
export const PullRefresh = forwardRef<PullRefreshHandle, PullRefreshProps>(function PullRefresh(
  { children, threshold = PULL_THRESHOLD, max = PULL_MAX, height = 0, disabled = false, onRefresh, className = '' },
  ref
) {
  const scroller = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pulling = useRef(false)
  const [distance, setDistance] = useState(0)
  const [status, setStatus] = useState<PullStatus>('idle')
  const [animating, setAnimating] = useState(true)

  useImperativeHandle(ref, () => ({
    finish() {
      setStatus('done')
      setTimeout(() => {
        setDistance(0)
        setStatus('idle')
      }, 300)
    }
  }))

  /*
   * 只在列表已经滚到顶部时才接管手势。
   * 不判断的话，用户在列表中间往下滑，滑动会被下拉刷新吃掉——
   * 列表不动，顶上却冒出个「下拉可以刷新」，看起来像卡住了。
   */
  const onStart = useCallback(
    (event: React.TouchEvent) => {
      if (disabled || status === 'refreshing') return
      const el = scroller.current
      if (!el || el.scrollTop > 0) return
      pulling.current = true
      setAnimating(false)
      startY.current = event.touches[0].clientY
    },
    [disabled, status]
  )

  const onMove = useCallback(
    (event: React.TouchEvent) => {
      if (!pulling.current) return
      const delta = event.touches[0].clientY - startY.current
      if (delta <= 0) {
        // 反向滑动交还给列表：这时用户是想往下看，不是想刷新
        pulling.current = false
        setAnimating(true)
        setDistance(0)
        setStatus('idle')
        return
      }
      // 手势接管之后要阻止页面滚动，否则整页会跟着一起动
      if (event.cancelable) event.preventDefault()
      const next = pullDistance(delta, max)
      setDistance(next)
      setStatus(pullStatus(next, threshold))
    },
    [max, threshold]
  )

  const onEnd = useCallback(() => {
    if (!pulling.current) return
    pulling.current = false
    setAnimating(true)
    if (!shouldRefresh(distance, threshold)) {
      setDistance(0)
      setStatus('idle')
      return
    }
    // 停在阈值处而不是收回零：收回零的话指示器立刻消失，用户会再拉一次
    setDistance(refreshingOffset(threshold))
    setStatus('refreshing')
    onRefresh?.()
  }, [distance, threshold, onRefresh])

  const hint = pullHint(status)

  return (
    <div
      ref={scroller}
      className={`i-pull ${className}`.trim()}
      style={height ? { height } : undefined}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      <div
        className="i-pull__body"
        style={{
          transform: `translateY(${distance}px)`,
          // 拖动中不做过渡，松手回弹才做：带着过渡拖，手感是黏的
          transition: animating ? 'transform var(--i-motion-base) var(--i-motion-easing-out)' : 'none'
        }}
      >
        {/*
          提示区挂在内容上方、靠位移露出来，而不是插进文档流。
          插进来的话，刷新开始那一刻列表会整块往下跳一次。
          aria-live 让读屏跟得上：「正在刷新」对他们否则完全不存在。
        */}
        <div className="i-pull__head" style={{ height: threshold, marginTop: -threshold }} aria-live="polite">
          {status === 'refreshing' ? (
            <Loading size="sm" text={hint} />
          ) : hint ? (
            <span className="i-pull__hint">
              <Icon name="arrow-right" size={14} className={status === 'ready' ? 'is-flipped' : ''} />
              {hint}
            </span>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
})
