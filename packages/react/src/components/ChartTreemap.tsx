import { useMemo, useState } from 'react'
import { useConfig } from './ConfigProvider'
import { formatTick, treemapLayout, type TreemapItem } from '@i-design/common'

export interface ChartTreemapProps {
  items: TreemapItem[]
  title?: string
  height?: number
  unit?: string
}

const W = 640

export function ChartTreemap({ items, title = '', height = 300, unit = '' }: ChartTreemapProps) {
  /* 文案走字典：数据表是图表的无障碍出口，按钮与表头也得跟着换语言 */
  const { locale } = useConfig()
  const [active, setActive] = useState<string | null>(null)
  const [showTable, setShowTable] = useState(false)

  const tiles = useMemo(() => treemapLayout(items, W, height), [items, height])

  /*
   * 矩形树图的块表达的是「多少」而不是「谁」，因此用单色顺序色阶：
   * 分类色会让人以为颜色另有含义，而面积已经在表达量级了。
   * 色阶共 5 档，按占比取档。
   */
  const stepOf = (percent: number) => {
    const max = Math.max(...items.map((i) => i.value), 1)
    const total = items.reduce((s, i) => s + i.value, 0) || 1
    const ratio = (percent * total) / max
    return Math.min(5, Math.max(1, Math.round(ratio * 4) + 1))
  }

  /* 小块放不下文字：塞进去会溢出到相邻块上，看起来像标错了 */
  const fits = (t: { width: number; height: number }) => t.width > 56 && t.height > 34

  const hit = tiles.find((t) => t.label === active)

  return (
    <figure className="i-chart">
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <svg
        className="i-chart__svg"
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={title || '矩形树图'}
        onMouseLeave={() => setActive(null)}
      >
        {tiles.map((tile) => {
          const step = stepOf(tile.percent)
          return (
            <g
              key={tile.label}
              className={`i-treemap__tile${active === tile.label ? ' is-active' : ''}`}
              style={{ ['--i-treemap-ink' as string]: `var(--i-chart-seq-${step}-ink)` }}
              onMouseEnter={() => setActive(tile.label)}
            >
              <rect
                x={tile.x + 1}
                y={tile.y + 1}
                width={Math.max(0, tile.width - 2)}
                height={Math.max(0, tile.height - 2)}
                fill={`var(--i-chart-seq-${step})`}
                rx="2"
              />
              {fits(tile) && (
                <>
                  <text className="i-treemap__label" x={tile.x + 10} y={tile.y + 22}>
                    {tile.label}
                  </text>
                  <text className="i-treemap__value" x={tile.x + 10} y={tile.y + 38}>
                    {formatTick(tile.value)}
                    {unit} · {Math.round(tile.percent * 100)}%
                  </text>
                </>
              )}
              <title>
                {tile.label}：{formatTick(tile.value)}
                {unit}（{Math.round(tile.percent * 100)}%）
              </title>
            </g>
          )
        })}
      </svg>

      {hit && (
        <p className="i-box__readout">
          <strong>{hit.label}</strong>
          {formatTick(hit.value)}
          {unit} · {Math.round(hit.percent * 100)}%
        </p>
      )}

      <button className="i-chart__table-toggle" onClick={() => setShowTable(!showTable)}>
        {showTable ? locale.chartTableHide : locale.chartTableShow}
      </button>
      {showTable && (
        <table className="i-chart__table">
          <thead>
            <tr><th>项目</th><th>{locale.chartValue}</th><th>{locale.chartPercent}</th></tr>
          </thead>
          <tbody>
            {tiles.map((tile) => (
              <tr key={tile.label}>
                <td>{tile.label}</td>
                <td>
                  {formatTick(tile.value)}
                  {unit}
                </td>
                <td>{Math.round(tile.percent * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  )
}
