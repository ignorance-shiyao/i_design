import { useConfig } from './ConfigProvider'

export interface ProgressProps {
  /** 0-100；indeterminate 时忽略 */
  percent?: number
  type?: 'line' | 'circle'
  /** 100% 不自动变成功色：进度走完不等于任务成功 */
  status?: 'normal' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  indeterminate?: boolean
  showText?: boolean
  text?: string
  /** 无障碍名。不传时用字典里的「加载中」——读屏遇到没有名字的进度条只会念「进度条」 */
  ariaLabel?: string
  /** 环形直径 */
  width?: number
  className?: string
}

export function Progress({
  percent = 0,
  type = 'line',
  status = 'normal',
  size = 'md',
  indeterminate = false,
  showText = true,
  text = '',
  ariaLabel = '',
  width = 96,
  className = ''
}: ProgressProps) {
  /* 进度条没有名字时，读屏只会念「进度条」，听不出这是在加载什么 */
  const { locale } = useConfig()
  const clamped = Math.min(100, Math.max(0, percent))
  const label = text || `${Math.round(clamped)}%`

  if (type === 'circle') {
    // 周长按实际半径算，写死会在改尺寸时错位
    const stroke = size === 'sm' ? 4 : size === 'lg' ? 10 : 6
    const radius = (width - stroke) / 2
    const circumference = 2 * Math.PI * radius

    return (
      <div
        className={['i-progress', 'i-progress--circle', `i-progress--${status}`, `i-progress--${size}`, className]
          .filter(Boolean)
          .join(' ')}
        role="progressbar"
        aria-label={ariaLabel || locale.loading}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg className="i-progress__circle" width={width} height={width}>
          <circle
            className="i-progress__circle-track"
            cx={width / 2}
            cy={width / 2}
            r={radius}
            strokeWidth={stroke}
          />
          <circle
            className="i-progress__circle-bar"
            cx={width / 2}
            cy={width / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
          />
        </svg>
        {showText && <span className="i-progress__circle-label">{label}</span>}
      </div>
    )
  }

  return (
    <div
      className={[
        'i-progress',
        `i-progress--${status}`,
        `i-progress--${size}`,
        indeterminate ? 'is-indeterminate' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      role="progressbar"
      aria-label={ariaLabel || locale.loading}
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="i-progress__track">
        <div className="i-progress__bar" style={{ width: `${clamped}%` }} />
      </div>
      {showText && !indeterminate && <span className="i-progress__text">{label}</span>}
    </div>
  )
}
