import { useMemo, useState } from 'react'
import { useConfig } from './ConfigProvider'
import { formatTick, sankeyLayout, type SankeyLink } from '@i-design/common'

export interface ChartSankeyProps {
  links: SankeyLink[]
  /** key → 显示名；不传就直接用 key */
  labels?: Record<string, string>
  title?: string
  height?: number
  unit?: string
}

const W = 640
const PAD = { top: 12, right: 96, bottom: 12, left: 12 }

export function ChartSankey({
  links,
  labels = {},
  title = '',
  height = 300,
  unit = ''
}: ChartSankeyProps) {
  /* 文案走字典：数据表是图表的无障碍出口，按钮与表头也得跟着换语言 */
  const { locale } = useConfig()
  const [active, setActive] = useState<string | null>(null)
  const [showTable, setShowTable] = useState(false)

  const layout = useMemo(
    () =>
      sankeyLayout(links, W - PAD.left - PAD.right, height - PAD.top - PAD.bottom, { labels }),
    [links, labels, height]
  )

  /* 节点是「身份」，因此用分类色按层内顺序分配，超过 8 个不再循环 */
  const colorOf = (key: string) => {
    const index = layout.nodes.findIndex((n) => n.key === key)
    return index >= 0 && index < 8 ? `var(--i-chart-${index + 1})` : 'var(--i-color-text-tertiary)'
  }

  return (
    <figure className="i-chart">
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <svg
        className="i-chart__svg"
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={title || '桑基图'}
        onMouseLeave={() => setActive(null)}
      >
        <g transform={`translate(${PAD.left} ${PAD.top})`}>
          {/*
            缎带先画、节点后画：缎带在节点处收口，节点压在上面才能盖住接缝。
            半透明让交叉处仍能看出下面还有一条流。
          */}
          {layout.ribbons.map((ribbon, i) => (
            <path
              key={`r-${i}`}
              className={`i-sankey__ribbon${
                active !== null && active !== ribbon.from && active !== ribbon.to ? ' is-dim' : ''
              }`}
              d={ribbon.path}
              fill={colorOf(ribbon.from)}
              onMouseEnter={() => setActive(ribbon.from)}
            >
              <title>
                {labels[ribbon.from] ?? ribbon.from} → {labels[ribbon.to] ?? ribbon.to}：
                {formatTick(ribbon.value)}
                {unit}
              </title>
            </path>
          ))}

          {layout.nodes.map((node) => (
            <g key={node.key} className="i-sankey__node" onMouseEnter={() => setActive(node.key)}>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill={colorOf(node.key)}
                rx="2"
              />
              {/* 名称与流量直接标在节点旁：桑基图没有坐标轴，不标就读不出量 */}
              <text
                className="i-chart__tick i-sankey__label"
                x={node.x + node.width + 6}
                y={node.y + node.height / 2 + 4}
              >
                {node.label} {formatTick(node.value)}
                {unit}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <button className="i-chart__table-toggle" onClick={() => setShowTable(!showTable)}>
        {showTable ? locale.chartTableHide : locale.chartTableShow}
      </button>
      {showTable && (
        <table className="i-chart__table">
          <thead>
            <tr><th>从</th><th>到</th><th>流量</th></tr>
          </thead>
          <tbody>
            {links.map((link, i) => (
              <tr key={i}>
                <td>{labels[link.from] ?? link.from}</td>
                <td>{labels[link.to] ?? link.to}</td>
                <td>
                  {formatTick(link.value)}
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  )
}
