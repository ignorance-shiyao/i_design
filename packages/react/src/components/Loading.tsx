import { useEffect, useRef, useState, type ReactNode } from 'react'
import { elapsedInterval, elapsedParts, shouldShowElapsed } from '@i-design/common'
import { useConfig } from './ConfigProvider'

export interface LoadingProps {
  loading?: boolean
  text?: string
  size?: 'sm' | 'md' | 'lg'
  fullscreen?: boolean
  /**
   * 显示已等待时长。
   *
   * 智能体的一次调用动辄十几秒，只转圈不给数字的话，三秒和三十秒看起来一样，
   * 于是有人反复点，或者以为卡死了刷新页面——前一次的结果就此丢掉。
   */
  elapsed?: boolean
  children?: ReactNode
}

/** 有子元素时作为区域遮罩，内容仍在下方可见，加载结束不产生布局跳动 */
export function Loading({
  loading = true,
  text = '',
  size = 'md',
  fullscreen = false,
  elapsed = false,
  children
}: LoadingProps) {
  const { locale } = useConfig()

  /*
   * 计时按目标时刻反算而不是累加间隔：页面切到后台时定时器会被节流，
   * 累加的写法回到前台一看会明显偏慢。
   */
  const since = useRef(0)
  const [waited, setWaited] = useState(0)
  useEffect(() => {
    if (!loading || !elapsed) return
    since.current = Date.now()
    setWaited(0)
    let timer = 0
    const tick = () => {
      const ms = Date.now() - since.current
      setWaited(ms)
      timer = window.setTimeout(tick, elapsedInterval(ms))
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [loading, elapsed])

  const parts = elapsedParts(waited)
  const elapsedText =
    elapsed && shouldShowElapsed(waited)
      ? parts.minutes
        ? `${parts.minutes}${locale.minuteUnit} ${parts.seconds}${locale.secondUnit}`
        : `${parts.seconds}${locale.secondUnit}`
      : ''
  const indicator = (
    <span className={`i-loading i-loading--${size}`} role="status" aria-label={text || locale.loading}>
      <span className="i-loading__spinner" />
      {text && <span className="i-loading__text">{text}</span>}
      {elapsedText && <span className="i-loading__elapsed">{elapsedText}</span>}
    </span>
  )

  if (!children) return loading ? indicator : null

  return (
    <div className="i-loading-wrap">
      {children}
      {loading && (
        <div className={['i-loading-mask', fullscreen ? 'is-fullscreen' : ''].filter(Boolean).join(' ')}>
          {indicator}
        </div>
      )}
    </div>
  )
}
