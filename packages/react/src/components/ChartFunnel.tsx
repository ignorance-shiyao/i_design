import { useState } from 'react'
import { formatTick, funnelShapes } from '@i-design/common'

export interface FunnelStage {
  name: string
  value: number
}

export interface ChartFunnelProps {
  stages: FunnelStage[]
  title?: string
  unit?: string
  height?: number
  className?: string
}

const W = 420

/**
 * 转化漏斗。
 * 层宽按数值比例缩，不做等差递减——等差看着更顺，但那是画出来的顺，不是数据里的顺。
 * 层级有序，因此用单色阶而不是分类色。
 */
export function ChartFunnel({ stages, title = '', unit = '', height = 240, className = '' }: ChartFunnelProps) {
  const [active, setActive] = useState<number | null>(null)
  const shapes = funnelShapes(stages.map((s) => s.value), W, height)
  const colorOf = (index: number) => `var(--i-chart-seq-${Math.min(5, index + 1)})`

  return (
    <figure className={['i-chart', className].filter(Boolean).join(' ')}>
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <div className="i-chart__funnel">
        <svg viewBox={`0 0 ${W} ${height}`} style={{ height }} role="img" aria-label={title || '漏斗图'}>
          {shapes.map((shape, index) => (
            <polygon
              key={stages[index].name}
              points={shape.points}
              fill={colorOf(index)}
              stroke="var(--i-color-bg)"
              strokeWidth={2}
              opacity={active === null || active === index ? 1 : 0.6}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>

        {/* 数值与转化率写在右侧：写在梯形里，窄的那几层放不下 */}
        <ol className="i-chart__funnel-legend">
          {stages.map((stage, index) => (
            <li
              key={stage.name}
              className={active === index ? 'is-active' : ''}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="i-chart__swatch" style={{ background: colorOf(index) }} />
              <span className="i-chart__funnel-name">{stage.name}</span>
              <span className="i-chart__funnel-value">
                {formatTick(stage.value)}
                {unit}
              </span>
              <span className="i-chart__funnel-rate">
                {index === 0 ? '起点' : `较上一步 ${(shapes[index].step * 100).toFixed(1)}%`}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  )
}
