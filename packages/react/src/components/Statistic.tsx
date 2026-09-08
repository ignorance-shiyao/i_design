import { Icon } from './Icon'

export interface StatisticProps {
  title?: string
  value: number | string
  prefix?: string
  suffix?: string
  precision?: number
  /** 千分位分隔 */
  separator?: boolean
  type?: 'default' | 'brand' | 'success' | 'danger'
  size?: 'md' | 'sm'
  /** 同比变化，正数向上、负数向下 */
  trend?: number
  extra?: string
  className?: string
}

export function Statistic({
  title = '',
  value,
  prefix = '',
  suffix = '',
  precision = 0,
  separator = true,
  type = 'default',
  size = 'md',
  trend = 0,
  extra = '',
  className = ''
}: StatisticProps) {
  let display: string
  if (typeof value === 'string') {
    display = value
  } else {
    const fixed = value.toFixed(precision)
    if (!separator) {
      display = fixed
    } else {
      // 只给整数部分加分隔符，小数部分保持原样
      const [int, decimal] = fixed.split('.')
      const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      display = decimal ? `${grouped}.${decimal}` : grouped
    }
  }

  return (
    <div
      className={['i-statistic', `i-statistic--${type}`, `i-statistic--${size}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {title && <div className="i-statistic__title">{title}</div>}
      <div className="i-statistic__value">
        {prefix && <span className="i-statistic__affix">{prefix}</span>}
        <span>{display}</span>
        {suffix && <span className="i-statistic__affix">{suffix}</span>}
      </div>
      {(trend !== 0 || extra) && (
        <div className="i-statistic__extra">
          {trend !== 0 && (
            <span className={['i-statistic__trend', trend > 0 ? 'is-up' : 'is-down'].join(' ')}>
              <Icon name={trend > 0 ? 'chevron-up' : 'chevron-down'} size={12} />
              {Math.abs(trend)}%
            </span>
          )}
          {extra && <span>{extra}</span>}
        </div>
      )}
    </div>
  )
}
