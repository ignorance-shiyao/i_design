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
  const status = hit?.status ?? 'brand'
  /** 弧线用填充色 */
  const color = `var(--i-color-${status})`
  /*
   * 中间那个数字用 `-text` 那一档：填充色是给「一大块色」定的，
   * 24px 的数字写在白底上只有 2.3:1，一眼看过去有颜色，读具体数值却要眯眼。
   */
  const textColor = `var(--i-color-${status}-text)`

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
          <strong style={{ color: textColor }}>
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
