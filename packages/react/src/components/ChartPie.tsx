import { useState } from 'react'
import { formatTick, pieSlices } from '@i-design/common'

export interface PieItem {
  name: string
  value: number
}

export interface ChartPieProps {
  items: PieItem[]
  /** 环形：读者比较的是弧长而不是面积，比实心饼更容易读准 */
  donut?: boolean
  size?: number
  title?: string
  centerLabel?: string
  unit?: string
  className?: string
}

export function ChartPie({
  items,
  donut = true,
  size = 200,
  title = '',
  centerLabel = '',
  unit = '',
  className = ''
}: ChartPieProps) {
  const [active, setActive] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const radius = size / 2
  const inner = donut ? radius * 0.62 : 0
  const slices = pieSlices(items.map((i) => i.value), radius, inner, { x: radius, y: radius })
  const total = items.reduce((sum, i) => sum + Math.max(0, i.value), 0)
  const colorOf = (index: number) => `var(--i-chart-${(index % 8) + 1})`

  return (
    <figure className={['i-chart', 'i-chart--pie', className].filter(Boolean).join(' ')}>
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <div className="i-chart__pie">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title || '占比图'}>
          {slices.map((slice, index) => (
            <path
              key={items[index].name}
              className="i-chart__slice"
              d={slice.path}
              fill={colorOf(index)}
              opacity={active === null || active === index ? 1 : 0.5}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
          {donut && (
            <text className="i-chart__center" x={radius} y={radius - 2} textAnchor="middle">
              {active === null ? formatTick(total) : formatTick(items[active].value)}
              {unit}
            </text>
          )}
          {donut && (centerLabel || active !== null) && (
            <text className="i-chart__center-label" x={radius} y={radius + 16} textAnchor="middle">
              {active === null ? centerLabel : items[active].name}
            </text>
          )}
        </svg>

        {/* 数值写在图例上：扇区一小就会互相压字 */}
        <ul className="i-chart__pie-legend">
          {items.map((item, index) => (
            <li
              key={item.name}
              className={active === index ? 'is-active' : ''}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="i-chart__swatch" style={{ background: colorOf(index) }} />
              <span className="i-chart__pie-name">{item.name}</span>
              <span className="i-chart__pie-value">
                {formatTick(item.value)}
                {unit}
                <em>{((slices[index]?.percent ?? 0) * 100).toFixed(1)}%</em>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button className="i-chart__table-toggle" onClick={() => setShowTable(!showTable)}>
        {showTable ? '收起数据表' : '查看数据表'}
      </button>
      {showTable && (
        <table className="i-chart__table">
          <thead>
            <tr>
              <th>类别</th>
              <th>数值</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`row-${item.name}`}>
                <td>{item.name}</td>
                <td>
                  {formatTick(item.value)}
                  {unit}
                </td>
                <td>{((slices[index]?.percent ?? 0) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  )
}
