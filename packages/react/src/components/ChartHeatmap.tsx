import { useState } from 'react'
import { formatTick, heatLevel } from '@i-design/common'

export interface ChartHeatmapProps {
  /** 行 × 列的二维数值 */
  matrix: number[][]
  rows: string[]
  columns: string[]
  title?: string
  unit?: string
  className?: string
}

/** 单色阶而不是彩虹：热力图编码的是量级，彩虹会让读者以为颜色代表类别 */
export function ChartHeatmap({ matrix, rows, columns, title = '', unit = '', className = '' }: ChartHeatmapProps) {
  const [active, setActive] = useState<{ r: number; c: number } | null>(null)
  const flat = matrix.flat()
  const min = Math.min(...flat)
  const max = Math.max(...flat)

  const colorOf = (value: number) => `var(--i-chart-seq-${heatLevel(value, min, max, 5) + 1})`
  // 深色格子上用反色文字，任何一格的数字都读得出来
  const textOf = (value: number) =>
    heatLevel(value, min, max, 5) >= 3 ? 'var(--i-color-text-inverse)' : 'var(--i-color-text)'

  return (
    <figure className={['i-chart', className].filter(Boolean).join(' ')}>
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <div className="i-chart__heat">
        <table className="i-chart__heat-grid">
          <thead>
            <tr>
              <th />
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row}>
                <th>{row}</th>
                {matrix[r].map((value, c) => (
                  <td
                    key={`${r}-${c}`}
                    style={{ background: colorOf(value), color: textOf(value) }}
                    className={active?.r === r && active?.c === c ? 'is-active' : ''}
                    onMouseEnter={() => setActive({ r, c })}
                    onMouseLeave={() => setActive(null)}
                  >
                    {formatTick(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* 图例说明色深对应的量级；没有它，颜色只是好看而不可读 */}
        <div className="i-chart__heat-scale">
          <span>
            {formatTick(min)}
            {unit}
          </span>
          {[1, 2, 3, 4, 5].map((step) => (
            <span key={step} className="i-chart__heat-swatch" style={{ background: `var(--i-chart-seq-${step})` }} />
          ))}
          <span>
            {formatTick(max)}
            {unit}
          </span>
        </div>
      </div>
    </figure>
  )
}
