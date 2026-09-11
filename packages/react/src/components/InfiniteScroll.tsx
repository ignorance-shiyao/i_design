import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { rafThrottle, loadHint, shouldLoadMore, type LoadStatus } from '@i-design/common'
import { Loading } from './Loading'

export interface InfiniteScrollProps {
  children?: ReactNode
  status?: LoadStatus
  /** 距底多少像素开始加载 */
  threshold?: number
  /** 容器高度；不传就跟随外层，由页面自己滚动 */
  height?: number
  /** 一条都没有时，「没有更多了」要换成「暂无内容」 */
  empty?: boolean
  onLoad?: () => void
  onRetry?: () => void
  className?: string
}

export function InfiniteScroll({
  children,
  status = 'idle',
  threshold = 120,
  height = 0,
  empty = false,
  onLoad,
  onRetry,
  className = ''
}: InfiniteScrollProps) {
  const root = useRef<HTMLDivElement>(null)

  const check = useCallback(() => {
    const el = root.current
    if (!el) return
    // 自己滚动时量自己，跟随页面滚动时量视口
    const metrics = height
      ? { scrollTop: el.scrollTop, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight }
      : {
          scrollTop: window.scrollY,
          clientHeight: window.innerHeight,
          scrollHeight: el.getBoundingClientRect().bottom + window.scrollY
        }
    if (shouldLoadMore(metrics, status, threshold)) onLoad?.()
  }, [height, status, threshold, onLoad])

  /*
   * 内容变了也要复查一次：加载回来的一页如果还是没撑满容器，
   * 就没有滚动条，用户再怎么划也到不了底，列表会永远停在这一页。
   * 这是无限滚动最常见的死局，而它只在「窗口很高」或「每页很少」时才暴露。
   */
  useEffect(() => {
    const target: HTMLElement | Window | null = height ? root.current : window
    /* 合并到每帧一次：check 每次都要量 rect 与滚动尺寸 */
    const onScroll = rafThrottle(check)
    target?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    const observer = new ResizeObserver(onScroll)
    if (root.current) observer.observe(root.current)
    check()
    return () => {
      target?.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      onScroll.cancel()
      observer.disconnect()
    }
  }, [check, height])

  const hint = loadHint(status, empty)

  return (
    <div
      ref={root}
      className={['i-infinite', height ? 'is-scroller' : '', className].filter(Boolean).join(' ')}
      style={height ? { height } : undefined}
    >
      {children}

      {/*
        状态区一直占位，而不是加载时才插进来：
        插进来会把列表往上顶一下，用户正在读的那一行会跳走。
        aria-live 让读屏在这里播报进度，否则「加载中」对他们完全不存在。
      */}
      <div className="i-infinite__foot" aria-live="polite">
        {status === 'loading' && <Loading size="sm" text={hint} />}
        {status === 'error' && (
          <button className="i-infinite__retry" onClick={onRetry}>
            {hint}
          </button>
        )}
        {status === 'finished' && <span className="i-infinite__done">{hint}</span>}
      </div>
    </div>
  )
}
