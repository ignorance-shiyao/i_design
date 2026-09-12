import { useMemo, useState } from 'react'
import { useConfig } from './ConfigProvider'
import {
  formatTick,
  niceTicks,
  scaleY,
  waterfallBars,
  waterfallDomain,
  type WaterfallItem
} from '@i-design/common'

export interface ChartWaterfallProps {
  items: WaterfallItem[]
  title?: string
  height?: number
  unit?: string
}

const W = 640
const PAD = { top: 24, right: 16, bottom: 44, left: 56 }
const sign = (v: number) => (v > 0 ? `+${formatTick(v)}` : formatTick(v))

export function ChartWaterfall({
  items,
  title = '',
  height = 280,
  unit = ''
}: ChartWaterfallProps) {
  /* 文案走字典：数据表是图表的无障碍出口，按钮与表头也得跟着换语言 */
  const { locale } = useConfig()
  const [active, setActive] = useState(-1)
  const [showTable, setShowTable] = useState(false)

  const plotW = W - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const bars = useMemo(() => waterfallBars(items), [items])

  const scale = useMemo(() => {
    const [lo, hi] = waterfallDomain(bars)
    const ticks = niceTicks(lo, hi, 5)
    return { ticks, min: ticks[0], max: ticks[ticks.length - 1] }
  }, [bars])

  const y = (v: number) => scaleY(v, scale.min, scale.max, plotH) + PAD.top
  const band = plotW / Math.max(1, bars.length)
  const barW = Math.min(48, band * 0.62)
  const left = (i: number) => PAD.left + band * i + (band - barW) / 2

  return (
    <figure className="i-chart">
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <svg
        className="i-chart__svg"
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={title || '瀑布图'}
        onMouseLeave={() => setActive(-1)}
      >
        {scale.ticks.map((tick) => (
          <g key={tick}>
            <line className="i-chart__grid" x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} />
            <text className="i-chart__tick" x={PAD.left - 8} y={y(tick) + 4} textAnchor="end">
              {formatTick(tick)}
              {unit}
            </text>
          </g>
        ))}
        {/* 零线加重：瀑布图里「回到零」是有意义的位置 */}
        <line className="i-wf__zero" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />

        {/*
          连接线把上一根的终点引到下一根的起点。没有它，读者要自己在两根柱子之间
          脑补「接着往上/往下」，而这正是瀑布图区别于普通柱状图的地方。
        */}
        {bars.slice(0, -1).map((bar, i) => (
          <line
            key={`c-${i}`}
            className="i-wf__connector"
            x1={left(i) + barW}
            x2={left(i + 1)}
            y1={y(bar.end)}
            y2={y(bar.end)}
          />
        ))}

        {bars.map((bar, i) => (
          <g
            key={bar.label}
            className={`i-wf__bar is-${bar.kind}${active === i ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
          >
            <rect
              x={left(i)}
              y={Math.min(y(bar.start), y(bar.end))}
              width={barW}
              height={Math.max(2, Math.abs(y(bar.end) - y(bar.start)))}
              rx="2"
            />
            {/* 增减量直接标在柱子上：瀑布图的读者要的就是这个数 */}
            <text
              className="i-wf__value"
              x={left(i) + barW / 2}
              y={Math.min(y(bar.start), y(bar.end)) - 6}
              textAnchor="middle"
            >
              {bar.kind === 'total' ? formatTick(bar.end) : sign(bar.delta)}
            </text>
            <text className="i-chart__tick" x={left(i) + barW / 2} y={height - 20} textAnchor="middle">
              {bar.label}
            </text>
          </g>
        ))}
      </svg>

      {/*
        图例说明三种柱子。涨跌用发散色两端而不是状态色的绿/红：
        收入增加是好事、成本增加是坏事，「增加」本身没有好坏。
      */}
      <div className="i-chart__legend i-wf__legend">
        <span className="i-chart__legend-item"><span className="i-chart__swatch is-increase" />增加</span>
        <span className="i-chart__legend-item"><span className="i-chart__swatch is-decrease" />减少</span>
        <span className="i-chart__legend-item"><span className="i-chart__swatch is-total" />小计</span>
      </div>

      <button className="i-chart__table-toggle" onClick={() => setShowTable(!showTable)}>
        {showTable ? locale.chartTableHide : locale.chartTableShow}
      </button>
      {showTable && (
        <table className="i-chart__table">
          <thead>
            <tr><th>项目</th><th>增减</th><th>累计</th></tr>
          </thead>
          <tbody>
            {bars.map((bar) => (
              <tr key={bar.label}>
                <td>{bar.label}</td>
                <td>{bar.kind === 'total' ? '—' : sign(bar.delta)}</td>
                <td>{formatTick(bar.end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  )
}
