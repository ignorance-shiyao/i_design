import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useConfig } from '@i-design/react'
import { countdownInterval, countdownParts, formatCountdown } from '@i-design/common'

export interface CountDownProps {
  /** 倒计时总时长（毫秒），与 endTime 二选一 */
  time?: number
  /** 结束时刻（时间戳）；跨页面刷新仍然准，优先于 time */
  endTime?: number
  format?: string
  /** 毫秒级刷新：秒杀这类场景需要，代价是每 50ms 重绘一次 */
  millisecond?: boolean
  autoStart?: boolean
  /** 拆成一格一个数字：视觉上更像「计时器」 */
  separated?: boolean
  onEnd?: () => void
  onChange?: (remaining: number) => void
  className?: string
}

export function CountDown({
  time = 0,
  endTime = 0,
  format = 'HH:mm:ss',
  millisecond = false,
  autoStart = true,
  separated = false,
  onEnd,
  onChange,
  className = ''
}: CountDownProps) {
  /* 单位字走字典：换成英文字典后这里不该还写着「天时分秒」 */
  const { locale } = useConfig()
  const [remaining, setRemaining] = useState(time)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deadline = useRef(0)
  const handlers = useRef({ onEnd, onChange })
  handlers.current = { onEnd, onChange }

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])

  useEffect(() => {
    /*
     * 剩余时间按目标时刻反算，而不是每次减去一个间隔。
     * 页面切到后台时定时器会被节流，累减的写法回到前台就慢了好几秒。
     */
    deadline.current = endTime || Date.now() + time
    setRemaining(Math.max(0, deadline.current - Date.now()))
    if (!autoStart) return
    const step = () => {
      const left = Math.max(0, deadline.current - Date.now())
      setRemaining(left)
      handlers.current.onChange?.(left)
      if (left <= 0) {
        handlers.current.onEnd?.()
        return
      }
      timer.current = setTimeout(step, countdownInterval(left, millisecond))
    }
    step()
    return stop
  }, [time, endTime, autoStart, millisecond, stop])

  const text = formatCountdown(remaining, format)
  const parts = useMemo(() => {
    const p = countdownParts(remaining)
    const cells: { value: string; label: string }[] = []
    if (format.includes('D')) cells.push({ value: String(p.days), label: locale.dayUnit })
    if (format.includes('H')) cells.push({ value: String(p.hours).padStart(2, '0'), label: locale.hourUnit })
    if (format.includes('m')) cells.push({ value: String(p.minutes).padStart(2, '0'), label: locale.minuteUnit })
    if (format.includes('s')) cells.push({ value: String(p.seconds).padStart(2, '0'), label: locale.secondUnit })
    return cells
  }, [remaining, format])

  return (
    // aria-live="off"：读屏不该每秒播报一次，那会把整页朗读淹掉
    <div
      className={['i-countdown', className].filter(Boolean).join(' ')}
      role="timer"
      aria-live="off"
      aria-label={`剩余 ${text}`}
    >
      {separated ? (
        parts.map((cell) => (
          <span key={cell.label} className="i-countdown__group">
            <span className="i-countdown__cell">{cell.value}</span>
            <span className="i-countdown__unit">{cell.label}</span>
          </span>
        ))
      ) : (
        <span className="i-countdown__text">{text}</span>
      )}
    </div>
  )
}
