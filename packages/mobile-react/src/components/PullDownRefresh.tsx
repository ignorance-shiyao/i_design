import { useRef, useState, type ReactNode, type TouchEvent } from 'react'
import {
  PULL_LOADING_HEIGHT,
  pullDistance,
  pullRelease,
  pullRotate,
  pullState
} from '@i-design/common'
import { Icon, useConfig } from '@i-design/react'

export interface PullDownRefreshProps {
  /** 由调用方持有：刷新是异步的，什么时候算完只有它知道 */
  refreshing: boolean
  onRefresh?: () => void
  /** 各状态的文案，方便按业务口径改写 */
  texts?: { pulling: string; ready: string; refreshing: string }
  children?: ReactNode
}

/**
 * 下拉刷新。阻尼、阈值、松手后停在哪都在 logic/pull——
 * 各端各写一遍的结果是同一个手势在一端刷得动、在另一端刷不动。
 */
export function PullDownRefresh({
  refreshing,
  onRefresh,
  texts,
  children
}: PullDownRefreshProps) {
  /* 三段提示走字典；调用方传了 texts 则以它为准 */
  const { locale } = useConfig()
  const resolvedTexts = texts ?? {
    pulling: locale.pullToRefresh,
    ready: locale.releaseToRefresh,
    refreshing: locale.refreshing
  }
  const [distance, setDistance] = useState(0)
  const [settling, setSettling] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  const offset = refreshing ? PULL_LOADING_HEIGHT : distance
  const state = pullState(distance, refreshing)
  const text = state === 'refreshing' ? resolvedTexts.refreshing : state === 'ready' ? resolvedTexts.ready : resolvedTexts.pulling

  const onStart = (event: TouchEvent<HTMLDivElement>) => {
    // 只在真正到顶时接管手势：中途接管会把正常的向上滚动也吃掉
    if (refreshing || event.currentTarget.scrollTop > 0) return
    pulling.current = true
    setSettling(false)
    startY.current = event.touches[0].clientY
  }

  const onMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!pulling.current) return
    const delta = event.touches[0].clientY - startY.current
    setDistance(delta <= 0 ? 0 : pullDistance(delta))
  }

  const onEnd = () => {
    if (!pulling.current) return
    pulling.current = false
    setSettling(true)
    const rest = pullRelease(distance)
    setDistance(0)
    if (rest > 0) onRefresh?.()
  }

  return (
    <div
      className="i-pull-refresh"
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      <div
        className={['i-pull-refresh__body', settling ? 'is-settling' : ''].filter(Boolean).join(' ')}
        style={{ transform: `translateY(${offset}px)` }}
      >
        <div className="i-pull-refresh__indicator" role="status" aria-live="polite">
          {/* 箭头随下拉进度转，到阈值正好 180°——这本身就是「可以松手了」的提示，
              不必只靠文案。旋转挂在外层 span 上：Icon 只接受自己的那几个属性 */}
          <span
            className="i-pull-refresh__arrow"
            style={
              state === 'refreshing'
                ? undefined
                : { transform: `rotate(${90 + pullRotate(distance)}deg)`, display: 'inline-flex' }
            }
          >
            <Icon
              name={state === 'refreshing' ? 'refresh' : 'arrow-right'}
              size={16}
              spin={state === 'refreshing'}
            />
          </span>
          {text}
        </div>

        {children}
      </div>
    </div>
  )
}
