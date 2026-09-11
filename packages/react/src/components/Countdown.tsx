import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { countdownInterval, countdownRemaining, formatCountdown } from '@i-design/common'

export interface CountdownProps {
  /** 截止时刻的时间戳（毫秒） */
  value: number
  /** 模板：DD / HH / mm / ss / SSS，小写单字母不补零 */
  format?: string
  title?: string
  prefix?: string
  suffix?: string
  type?: 'default' | 'brand' | 'success' | 'danger'
  size?: 'md' | 'sm'
  /** 暂停。重新打开时走的仍是绝对时刻，不会「补回」暂停期间的时间 */
  running?: boolean
  onChange?: (remaining: number) => void
  onFinish?: () => void
  children?: (remaining: number, text: string) => ReactNode
  className?: string
}

/**
 * 倒计时。
 *
 * 每一跳都从绝对截止时刻重算，而不是把上一次的值减掉一个间隔：
 * 后者每跳都会积累几毫秒误差，页面挂一晚上能差出好几秒；
 * 标签页被切到后台时定时器还会被浏览器压慢，回来就直接错了。
 */
export function Countdown({
  value,
  format = 'HH:mm:ss',
  title = '',
  prefix = '',
  suffix = '',
  type = 'default',
  size = 'md',
  running = true,
  onChange,
  onFinish,
  children,
  className = ''
}: CountdownProps) {
  const [remaining, setRemaining] = useState(() => countdownRemaining(value, Date.now()))

  /* 回调放进 ref：把它们写进 effect 依赖里，父组件每次渲染都会重启定时器 */
  const onChangeRef = useRef(onChange)
  const onFinishRef = useRef(onFinish)
  onChangeRef.current = onChange
  onFinishRef.current = onFinish

  const read = useCallback(() => countdownRemaining(value, Date.now()), [value])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const showMs = /S/.test(format)
    let last = read()
    setRemaining(last)
    if (!running || last <= 0) return

    const tick = () => {
      const left = read()
      const wasRunning = last > 0
      last = left
      setRemaining(left)
      onChangeRef.current?.(left)
      if (left <= 0) {
        // 只在真正走到零的那一次发 finish：截止时刻早已过去时挂载不该触发，
        // 否则刷新页面会把「结束」的副作用再跑一遍
        if (wasRunning) onFinishRef.current?.()
        return
      }
      timer = setTimeout(tick, countdownInterval(left, showMs))
    }

    timer = setTimeout(tick, countdownInterval(last, showMs))
    return () => {
      if (timer !== null) clearTimeout(timer)
    }
  }, [read, running, format])

  const text = formatCountdown(remaining, format)
  const classes = [
    'i-countdown',
    'i-countdown--block',
    `i-countdown--${type}`,
    `i-countdown--${size}`,
    remaining <= 0 ? 'is-finished' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {title ? <div className="i-countdown__title">{title}</div> : null}
      <div className="i-countdown__value">
        {prefix ? <span className="i-countdown__affix">{prefix}</span> : null}
        <span>{children ? children(remaining, text) : text}</span>
        {suffix ? <span className="i-countdown__affix">{suffix}</span> : null}
      </div>
    </div>
  )
}
