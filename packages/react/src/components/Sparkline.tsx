import { areaPath, domainOf, linePath, scaleX, scaleY } from '@i-design/common'

export interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  /** 语义色：涨用成功色、跌用危险色时传它 */
  tone?: 'brand' | 'success' | 'danger' | 'neutral'
  area?: boolean
  showLast?: boolean
  className?: string
}

/** 嵌在指标卡或表格行里的走势图；不带坐标轴，也因此不从零起——形状才是它的信息 */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  tone = 'brand',
  area = true,
  showLast = true,
  className = ''
}: SparklineProps) {
  const domain = domainOf([{ name: '', data }], { fromZero: false })
  const color = tone === 'neutral' ? 'var(--i-color-text-tertiary)' : `var(--i-color-${tone})`

  return (
    <span className={['i-sparkline', className].filter(Boolean).join(' ')}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {area && (
          <path
            className="i-sparkline__area"
            d={areaPath(data, domain.min, domain.max, width, height)}
            fill={color}
          />
        )}
        <path
          className="i-sparkline__line"
          d={linePath(data, domain.min, domain.max, width, height)}
          stroke={color}
        />
        {showLast && (
          <circle
            className="i-sparkline__last"
            cx={scaleX(data.length - 1, data.length, width)}
            cy={scaleY(data[data.length - 1] ?? 0, domain.min, domain.max, height)}
            r={2.5}
            fill={color}
          />
        )}
      </svg>
    </span>
  )
}
