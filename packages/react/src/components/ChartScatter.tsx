import { useMemo, useState } from 'react'
import {
  SCATTER_MAX_SERIES,
  bubbleRadius,
  extentOf,
  formatTick,
  niceTicks,
  trendLine,
  type ScatterPoint,
  type ScatterSeries
} from '@i-design/common'

export interface ChartScatterProps {
  series: ScatterSeries[]
  /** 横轴名称，散点的两个轴都需要说明，否则读者不知道在看什么关系 */
  xLabel?: string
  yLabel?: string
  height?: number
  title?: string
  xUnit?: string
  yUnit?: string
  /** 叠加最小二乘拟合线与 R² */
  trend?: boolean
  className?: string
}

const W = 640
const PAD = { top: 16, right: 24, bottom: 40, left: 56 }

export function ChartScatter({
  series,
  xLabel = '',
  yLabel = '',
  height = 280,
  title = '',
  xUnit = '',
  yUnit = '',
  trend = false,
  className = ''
}: ChartScatterProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<{ series: string; point: ScatterPoint } | null>(null)
  const [showTable, setShowTable] = useState(false)
  // 同一页可能有多张散点图，裁剪区 id 必须各自唯一
  const clipId = useMemo(() => `i-scatter-clip-${Math.random().toString(36).slice(2, 9)}`, [])

  /*
   * 超出上限的系列合并成「其他」，而不是继续取色。
   * 散点里任意两点都可能贴着，配色要按所有两两组合校验；本体系的分类色在
   * 这个口径下只有前三槽能同时通过亮色与暗色。
   */
  const shown = useMemo(() => {
    if (series.length <= SCATTER_MAX_SERIES) return series
    const head = series.slice(0, SCATTER_MAX_SERIES - 1)
    const rest = series.slice(SCATTER_MAX_SERIES - 1)
    return [...head, { name: '其他', data: rest.flatMap((s) => s.data) }]
  }, [series])

  const plotW = W - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const visible = shown.filter((s) => !hidden.has(s.name))
  const allPoints = visible.flatMap((s) => s.data)

  const xExtent = extentOf(allPoints, 'x')
  const yExtent = extentOf(allPoints, 'y')
  const xTicks = niceTicks(xExtent.min, xExtent.max, 5)
  const yTicks = niceTicks(yExtent.min, yExtent.max, 5)
  const xScale = { min: xTicks[0], max: xTicks[xTicks.length - 1] }
  const yScale = { min: yTicks[0], max: yTicks[yTicks.length - 1] }

  const px = (v: number) => PAD.left + ((v - xScale.min) / (xScale.max - xScale.min)) * plotW
  const py = (v: number) => PAD.top + plotH - ((v - yScale.min) / (yScale.max - yScale.min)) * plotH

  const sizeExtent = extentOf(allPoints.filter((p) => p.size !== undefined), 'size')
  const hasSize = allPoints.some((p) => p.size !== undefined)
  const radiusOf = (point: ScatterPoint) =>
    point.size === undefined ? 5 : bubbleRadius(point.size, sizeExtent.min, sizeExtent.max)

  const colorOf = (name: string) =>
    `var(--i-chart-${(shown.findIndex((s) => s.name === name) % SCATTER_MAX_SERIES) + 1})`

  const fits = trend
    ? visible
        .map((s) => ({ name: s.name, fit: trendLine(s.data) }))
        .filter((row): row is { name: string; fit: NonNullable<ReturnType<typeof trendLine>> } => row.fit !== null)
    : []

  function toggle(name: string) {
    const next = new Set(hidden)
    if (next.has(name)) next.delete(name)
    else if (shown.length - next.size > 1) next.add(name)
    setHidden(next)
  }

  return (
    <figure className={['i-chart', 'i-chart--scatter', className].filter(Boolean).join(' ')}>
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <svg
        className="i-chart__svg"
        viewBox={`0 0 ${W} ${height}`}
        style={{ height }}
        role="img"
        aria-label={title || '散点图'}
      >
        {/* 两个方向都要网格：散点要同时读出横纵两个坐标 */}
        {yTicks.map((tick) => (
          <line key={`gy-${tick}`} className="i-chart__grid" x1={PAD.left} x2={W - PAD.right} y1={py(tick)} y2={py(tick)} />
        ))}
        {xTicks.map((tick) => (
          <line key={`gx-${tick}`} className="i-chart__grid" x1={px(tick)} x2={px(tick)} y1={PAD.top} y2={height - PAD.bottom} />
        ))}
        {yTicks.map((tick) => (
          <text key={`ty-${tick}`} className="i-chart__tick" x={PAD.left - 8} y={py(tick) + 4} textAnchor="end">
            {formatTick(tick)}
          </text>
        ))}
        {xTicks.map((tick) => (
          <text key={`tx-${tick}`} className="i-chart__tick" x={px(tick)} y={height - PAD.bottom + 18} textAnchor="middle">
            {formatTick(tick)}
          </text>
        ))}

        {xLabel && (
          <text className="i-chart__axis-name" x={PAD.left + plotW / 2} y={height - 6} textAnchor="middle">
            {xLabel}
            {xUnit}
          </text>
        )}
        {yLabel && (
          <text
            className="i-chart__axis-name"
            transform={`translate(14 ${PAD.top + plotH / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            {yLabel}
            {yUnit}
          </text>
        )}

        {/*
          拟合线画在点之下（它是参考，不该盖住数据），并裁剪到绘图区内。
          不裁的话斜率大的拟合线会从网格顶端冲出去，看起来像坐标轴标错了。
        */}
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} />
          </clipPath>
        </defs>
        {fits.map((row) => (
          <line
            key={`fit-${row.name}`}
            clipPath={`url(#${clipId})`}
            className="i-chart__trend"
            x1={px(xScale.min)}
            y1={py(row.fit.slope * xScale.min + row.fit.intercept)}
            x2={px(xScale.max)}
            y2={py(row.fit.slope * xScale.max + row.fit.intercept)}
            stroke={colorOf(row.name)}
          />
        ))}

        {visible.map((s) => (
          <g key={s.name}>
            {s.data.map((point, i) => (
              <circle
                key={`${s.name}-${i}`}
                className="i-chart__point"
                cx={px(point.x)}
                cy={py(point.y)}
                r={radiusOf(point)}
                fill={colorOf(s.name)}
                onMouseEnter={() => setActive({ series: s.name, point })}
                onMouseLeave={() => setActive(null)}
              />
            ))}
          </g>
        ))}
      </svg>

      {active && (
        <div className="i-chart__tooltip is-static">
          <div className="i-chart__tooltip-title">{active.point.label || active.series}</div>
          <div className="i-chart__tooltip-row">
            <span className="i-chart__tooltip-name">{xLabel || 'x'}</span>
            <span className="i-chart__tooltip-value">
              {formatTick(active.point.x)}
              {xUnit}
            </span>
          </div>
          <div className="i-chart__tooltip-row">
            <span className="i-chart__tooltip-name">{yLabel || 'y'}</span>
            <span className="i-chart__tooltip-value">
              {formatTick(active.point.y)}
              {yUnit}
            </span>
          </div>
        </div>
      )}

      {(shown.length > 1 || hasSize) && (
        <div className="i-chart__legend">
          {shown.map((s) => (
            <button
              key={s.name}
              className={['i-chart__legend-item', hidden.has(s.name) ? 'is-off' : ''].filter(Boolean).join(' ')}
              onClick={() => toggle(s.name)}
            >
              <span className="i-chart__swatch" style={{ background: colorOf(s.name) }} />
              {s.name}
            </button>
          ))}
          {hasSize && <span className="i-chart__legend-note">气泡面积表示数值大小</span>}
        </div>
      )}

      {fits.length > 0 && (
        <p className="i-chart__note">
          {fits.map((row, i) => `${i > 0 ? ' · ' : ''}${row.name} R² ${row.fit.r2.toFixed(2)}`).join('')}
        </p>
      )}

      {/* 数据表：散点的坐标读屏读不出来，表格是唯一能读到的形式 */}
      <div className="i-chart__actions">
        <button className="i-chart__table-toggle" onClick={() => setShowTable(!showTable)}>
          {showTable ? '收起数据表' : '查看数据表'}
        </button>
      </div>
      {showTable && (
        <table className="i-chart__table">
          <thead>
            <tr>
              <th>系列</th>
              <th>{xLabel || 'x'}</th>
              <th>{yLabel || 'y'}</th>
            </tr>
          </thead>
          <tbody>
            {shown.flatMap((s) =>
              s.data.map((point, i) => (
                <tr key={`tr-${s.name}-${i}`}>
                  <td>{point.label || s.name}</td>
                  <td>
                    {formatTick(point.x)}
                    {xUnit}
                  </td>
                  <td>
                    {formatTick(point.y)}
                    {yUnit}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </figure>
  )
}
