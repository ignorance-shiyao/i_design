import { useState } from 'react'
import { polygonPath, radarPoints } from '@i-design/common'

export interface RadarSeries {
  name: string
  /** 与 axes 一一对应 */
  data: number[]
}

export interface ChartRadarProps {
  axes: string[]
  series: RadarSeries[]
  /** 各维度的满分；不传则取数据最大值 */
  max?: number
  size?: number
  title?: string
  className?: string
}

export function ChartRadar({ axes, series, max = 0, size = 240, title = '', className = '' }: ChartRadarProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const visible = series.filter((s) => !hidden.has(s.name))

  // 半径要给维度名让位：留太少时最右侧的名字会被画布裁掉
  const longest = Math.max(4, ...axes.map((a) => a.length))
  const radius = size / 2 - Math.min(size * 0.28, longest * 12) - 12
  const maxValue = max || Math.max(1, ...series.flatMap((s) => s.data))

  const colorOf = (name: string) => `var(--i-chart-${(series.findIndex((s) => s.name === name) % 8) + 1})`
  const pointsOf = (data: number[]) => radarPoints(data, maxValue, radius)

  const labelAt = (index: number) => {
    const angle = -Math.PI / 2 + (index / axes.length) * Math.PI * 2
    return {
      x: size / 2 + (radius + 14) * Math.cos(angle),
      y: size / 2 + (radius + 14) * Math.sin(angle) + 4,
      // 显式收窄类型：SVG 的 textAnchor 只接受这几个字面量
      anchor: (Math.abs(Math.cos(angle)) < 0.2
        ? 'middle'
        : Math.cos(angle) > 0
          ? 'start'
          : 'end') as 'middle' | 'start' | 'end'
    }
  }

  function toggle(name: string) {
    const next = new Set(hidden)
    if (next.has(name)) next.delete(name)
    else if (series.length - next.size > 1) next.add(name)
    setHidden(next)
  }

  return (
    <figure className={['i-chart', className].filter(Boolean).join(' ')}>
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <div className="i-chart__radar">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title || '雷达图'}>
          <g transform={`translate(${size / 2 - radius} ${size / 2 - radius})`}>
            {[0.25, 0.5, 0.75, 1].map((ring) => (
              <path
                key={ring}
                d={polygonPath(radarPoints(axes.map(() => maxValue * ring), maxValue, radius))}
                fill="none"
                stroke="var(--i-color-hairline)"
              />
            ))}
            {radarPoints(axes.map(() => maxValue), maxValue, radius).map((point, index) => (
              <line
                key={`axis-${index}`}
                x1={radius}
                y1={radius}
                x2={point.axisX}
                y2={point.axisY}
                stroke="var(--i-color-hairline)"
              />
            ))}

            {visible.map((s) => (
              <g key={s.name}>
                {/* 多系列只描边：两层半透明填充叠在一起是混合色，读者对不回图例 */}
                <path
                  d={polygonPath(pointsOf(s.data))}
                  fill={visible.length > 1 ? 'none' : colorOf(s.name)}
                  fillOpacity={0.18}
                  stroke={colorOf(s.name)}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {pointsOf(s.data).map((point, index) => (
                  <circle key={`${s.name}-${index}`} cx={point.x} cy={point.y} r={3} fill={colorOf(s.name)} />
                ))}
              </g>
            ))}
          </g>

          {axes.map((axis, index) => {
            const at = labelAt(index)
            return (
              <text key={axis} className="i-chart__tick" x={at.x} y={at.y} textAnchor={at.anchor}>
                {axis}
              </text>
            )
          })}
        </svg>
      </div>

      {series.length > 1 && (
        <div className="i-chart__legend">
          {series.map((s) => (
            <button
              key={s.name}
              className={['i-chart__legend-item', hidden.has(s.name) ? 'is-off' : ''].filter(Boolean).join(' ')}
              onClick={() => toggle(s.name)}
            >
              <span className="i-chart__swatch" style={{ background: colorOf(s.name) }} />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </figure>
  )
}
