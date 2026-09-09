import { gaugeArc } from '@i-design/common'

export interface ChartGaugeProps {
  value: number
  min?: number
  max?: number
  size?: number
  title?: string
  unit?: string
  /** 阈值：超过即转为对应状态色 */
  thresholds?: { value: number; status: 'success' | 'warning' | 'danger' }[]
  className?: string
}

/** 开口朝下的 270°：整圆会让满值与零值落在同一位置，无法分辨 */
export function ChartGauge({
  value,
  min = 0,
  max = 100,
  size = 180,
  title = '',
  unit = '',
  thresholds = [],
  className = ''
}: ChartGaugeProps) {
  const percent = max === min ? 0 : (value - min) / (max - min)
  const stroke = Math.max(8, size * 0.09)
  const arc = gaugeArc(percent, size / 2, stroke)

  const hit = [...thresholds]
    .sort((a, b) => a.value - b.value)
    .filter((t) => value >= t.value)
    .pop()
  const color = hit ? `var(--i-color-${hit.status})` : 'var(--i-color-brand)'

  return (
    <figure className={['i-chart', 'i-chart--gauge', className].filter(Boolean).join(' ')}>
      {title && <figcaption className="i-chart__title">{title}</figcaption>}
      <div className="i-chart__gauge" style={{ width: size, height: size * 0.78 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title || '仪表盘'}>
          <path d={arc.track} fill="none" stroke="var(--i-color-bg-muted)" strokeWidth={stroke} strokeLinecap="round" />
          {arc.value && (
            <path d={arc.value} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
          )}
        </svg>
        <div className="i-chart__gauge-label">
          <strong style={{ color }}>
            {value}
            {unit}
          </strong>
          <span>
            {min} – {max}
            {unit}
          </span>
        </div>
      </div>
    </figure>
  )
}
