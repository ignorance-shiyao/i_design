import { useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  areaPath,
  bandPath,
  domainOf,
  formatTick,
  linePath,
  niceTicks,
  scaleX,
  scaleY,
  type ChartSeries,
  type ChartThreshold
} from '@i-design/common'

export interface ChartProps {
  /** 每个系列一条线／一组柱；系列顺序即取色顺序 */
  series: ChartSeries[]
  labels: string[]
  type?: 'line' | 'area' | 'bar'
  /** 柱状图专用：堆叠而不是并排 */
  stacked?: boolean
  height?: number
  /** 折线是否从零起。柱状图恒从零起——不从零会放大差异 */
  fromZero?: boolean
  labelLast?: boolean
  title?: string
  unit?: string
  /**
   * 阈值线与阈值带：把「多少算正常」画进图里。
   * 只看趋势看不出「现在是不是超了」，而后者往往才是看这张图的原因。
   */
  thresholds?: ChartThreshold[]
  className?: string
}

const W = 640

export function Chart({
  series,
  labels,
  type = 'line',
  stacked = false,
  height = 240,
  fromZero = true,
  labelLast = true,
  title = '',
  unit = '',
  thresholds = [],
  className = ''
}: ChartProps) {
  const root = useRef<HTMLElement>(null)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const visible = series.filter((s) => !hidden.has(s.name))
  const isBar = type === 'bar'
  const isStackedBar = isBar && stacked
  const stackedArea = type === 'area' && visible.length > 1

  const pad = {
    top: 16,
    right: labelLast && !isBar ? 96 : 16,
    bottom: 28,
    left: 48
  }
  const plotW = W - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  const domain = domainOf(visible.length ? visible : series, {
    fromZero: isBar ? true : fromZero,
    stacked: isStackedBar || stackedArea
  })
  const ticks = useMemo(() => niceTicks(domain.min, domain.max, 5), [domain.min, domain.max])
  const scale = { min: ticks[0], max: ticks[ticks.length - 1] }

  const colorOf = (name: string) => `var(--i-chart-${(series.findIndex((s) => s.name === name) % 8) + 1})`
  const y = (v: number) => scaleY(v, scale.min, scale.max, plotH) + pad.top
  const x = (i: number) => scaleX(i, labels.length, plotW) + pad.left

  const bandWidth = plotW / Math.max(1, labels.length)
  const barWidth = isStackedBar ? bandWidth * 0.5 : (bandWidth * 0.62) / Math.max(1, visible.length)
  const barX = (si: number, i: number) => {
    const start = pad.left + bandWidth * i
    if (isStackedBar) return start + (bandWidth - barWidth) / 2
    return start + (bandWidth - barWidth * visible.length) / 2 + si * barWidth
  }
  const below = (i: number, si: number) =>
    visible.slice(0, si).reduce((sum, s) => sum + (s.data[i] ?? 0), 0)

  const areaSeries = visible.map((s, si) => ({
    name: s.name,
    data: stackedArea ? s.data.map((v, i) => v + below(i, si)) : s.data,
    base: stackedArea ? s.data.map((_, i) => below(i, si)) : s.data.map(() => Math.max(0, scale.min))
  }))

  // 末点标注：靠得太近的两行要错开，否则叠字
  const endLabels = visible
    .map((s, si) => {
      const raw = s.data[s.data.length - 1] ?? 0
      const plotted = stackedArea ? areaSeries[si].data[areaSeries[si].data.length - 1] ?? 0 : raw
      return { name: s.name, value: raw, plotted, y: y(plotted) }
    })
    .sort((a, b) => a.y - b.y)
    .map((row, i, rows) => {
      if (i > 0 && row.y - rows[i - 1].y < 15) row.y = rows[i - 1].y + 15
      return row
    })

  function toggle(name: string) {
    const next = new Set(hidden)
    // 不允许关掉最后一个系列：空图表没有信息量
    if (next.has(name)) next.delete(name)
    else if (series.length - next.size > 1) next.add(name)
    setHidden(next)
  }

  /* 超出值域的阈值静默丢弃：压到边缘会让读者误以为「刚好卡在临界」 */
  const marks = thresholds
    .filter((t) => t.value === undefined || (t.value >= scale.min && t.value <= scale.max))
    .map((t) => {
      const status = t.status ?? 'warning'
      if (t.value !== undefined) {
        return { kind: 'line' as const, status, label: t.label ?? '', y: y(t.value), height: 0 }
      }
      const from = Math.max(scale.min, t.from ?? scale.min)
      const to = Math.min(scale.max, t.to ?? scale.max)
      return { kind: 'band' as const, status, label: t.label ?? '', y: y(to), height: Math.max(0, y(from) - y(to)) }
    })

  /** 导出 CSV：数据表让读屏能读到，导出让人能拿去自己算 */
  function exportCsv() {
    const head = [title || '类别', ...series.map((s) => s.name)]
    const rows = labels.map((label, i) => [label, ...series.map((s) => String(s.data[i] ?? ''))])
    // 字段里可能有逗号或引号，按 RFC 4180 转义，否则列会串位
    const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
    const csv = [head, ...rows].map((r) => r.map(cell).join(',')).join('\n')
    // BOM：没有它 Excel 会把中文表头认成乱码
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'chart'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function onMove(event: MouseEvent<SVGSVGElement>) {
    const rect = root.current?.getBoundingClientRect()
    if (!rect || !labels.length) return
    const px = ((event.clientX - rect.left) / rect.width) * W
    const step = isBar ? bandWidth : plotW / Math.max(1, labels.length - 1)
    const index = Math.round((px - pad.left - (isBar ? bandWidth / 2 : 0)) / step)
    setActive(Math.min(labels.length - 1, Math.max(0, index)))
  }

  return (
    <figure ref={root} className={['i-chart', className].filter(Boolean).join(' ')}>
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <svg
        className="i-chart__svg"
        viewBox={`0 0 ${W} ${height}`}
        style={{ height }}
        role="img"
        aria-label={title || '图表'}
        onMouseMove={onMove}
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line className="i-chart__grid" x1={pad.left} x2={W - pad.right} y1={y(tick)} y2={y(tick)} />
            <text className="i-chart__tick" x={pad.left - 8} y={y(tick) + 4} textAnchor="end">
              {formatTick(tick)}
            </text>
          </g>
        ))}
        <line
          className="i-chart__axis"
          x1={pad.left}
          x2={W - pad.right}
          y1={y(Math.max(scale.min, 0))}
          y2={y(Math.max(scale.min, 0))}
        />

        {/*
          阈值画在网格之上、数据之下：它是参考背景，不该盖住数据本身。
          带用低不透明度填充，线用虚线——实线会被误读成又一个数据系列。
        */}
        {marks.map((mark, mi) => (
          <g key={`mark-${mi}`}>
            {mark.kind === 'band' ? (
              <rect
                className={`i-chart__mark-area is-${mark.status}`}
                x={pad.left}
                y={mark.y}
                width={plotW}
                height={mark.height}
              />
            ) : (
              <line
                className={`i-chart__mark-line is-${mark.status}`}
                x1={pad.left}
                x2={W - pad.right}
                y1={mark.y}
                y2={mark.y}
              />
            )}
          </g>
        ))}

        {labels.map((label, i) => (
          <text
            key={`${label}-${i}`}
            className="i-chart__tick"
            x={isBar ? pad.left + bandWidth * (i + 0.5) : x(i)}
            y={height - 8}
            textAnchor="middle"
            opacity={labels.length > 12 && i % 2 === 1 ? 0 : 1}
          >
            {label}
          </text>
        ))}

        {isBar
          ? visible.map((s, si) =>
              s.data.map((value, i) => (
                <rect
                  key={`${s.name}-${i}`}
                  className="i-chart__bar"
                  x={barX(si, i)}
                  y={isStackedBar ? y(below(i, si) + value) : y(Math.max(0, value))}
                  width={Math.max(1, barWidth)}
                  height={Math.max(0, Math.abs(y(value) - y(0)))}
                  fill={colorOf(s.name)}
                  rx={isStackedBar && si !== visible.length - 1 ? 0 : 3}
                  opacity={active === null || active === i ? 1 : 0.55}
                />
              ))
            )
          : null}

        {!isBar && (
          <>
            {type === 'area' &&
              areaSeries.map((s) => (
                <path
                  key={`area-${s.name}`}
                  className="i-chart__area"
                  d={
                    stackedArea
                      ? bandPath(s.base, s.data, scale.min, scale.max, plotW, plotH)
                      : areaPath(s.data, scale.min, scale.max, plotW, plotH)
                  }
                  fill={colorOf(s.name)}
                  transform={`translate(${pad.left} ${pad.top})`}
                />
              ))}
            {(type === 'area' ? areaSeries : visible).map((s) => (
              <path
                key={`line-${s.name}`}
                className="i-chart__line"
                d={linePath(s.data, scale.min, scale.max, plotW, plotH)}
                stroke={colorOf(s.name)}
                transform={`translate(${pad.left} ${pad.top})`}
              />
            ))}
            {labelLast &&
              endLabels.map((row) => (
                <g key={`label-${row.name}`}>
                  <circle
                    cx={x(labels.length - 1)}
                    cy={y(row.plotted)}
                    r={4}
                    className="i-chart__dot"
                    fill={colorOf(row.name)}
                  />
                  <text className="i-chart__label" x={x(labels.length - 1) + 10} y={row.y + 4}>
                    {row.name} {formatTick(row.value)}
                  </text>
                </g>
              ))}
          </>
        )}

        {/*
          阈值标签画在数据之上，线与带留在数据之下。
          标签跟着色带一起沉到底层时，数据线会正好从字上穿过。
        */}
        {marks.map((mark, mi) =>
          mark.label ? (
            <text
              key={`mark-label-${mi}`}
              className={`i-chart__mark-label is-${mark.status}`}
              x={W - pad.right - 4}
              y={mark.y + (mark.kind === 'band' ? 14 : -5)}
              textAnchor="end"
            >
              {mark.label}
            </text>
          ) : null
        )}

        {active !== null && !isBar && (
          <g>
            <line
              className="i-chart__crosshair"
              x1={x(active)}
              x2={x(active)}
              y1={pad.top}
              y2={height - pad.bottom}
            />
            {(type === 'area' ? areaSeries : visible).map((s) => (
              <circle
                key={`hit-${s.name}`}
                className="i-chart__dot"
                cx={x(active)}
                cy={y(s.data[active] ?? 0)}
                r={4.5}
                fill={colorOf(s.name)}
              />
            ))}
          </g>
        )}
      </svg>

      {active !== null && (
        <div
          className="i-chart__tooltip"
          style={{
            left: `${(((isBar ? pad.left + bandWidth * (active + 0.5) : x(active)) / W) * 100).toFixed(2)}%`,
            top: `${((y(scale.max) / height) * 100).toFixed(2)}%`
          }}
        >
          <div className="i-chart__tooltip-title">{labels[active]}</div>
          {visible.map((s) => (
            <div key={`tip-${s.name}`} className="i-chart__tooltip-row">
              <span className="i-chart__swatch" style={{ background: colorOf(s.name) }} />
              <span>{s.name}</span>
              <span className="i-chart__tooltip-value">
                {formatTick(s.data[active] ?? 0)}
                {unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 两个以上系列必有图例：颜色不能是识别身份的唯一通道 */}
      {series.length > 1 && (
        <div className="i-chart__legend">
          {series.map((s) => (
            <button
              key={`legend-${s.name}`}
              className={['i-chart__legend-item', hidden.has(s.name) ? 'is-off' : ''].filter(Boolean).join(' ')}
              aria-pressed={!hidden.has(s.name)}
              onClick={() => toggle(s.name)}
            >
              <span className="i-chart__swatch" style={{ background: colorOf(s.name) }} />
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="i-chart__actions">
        <button className="i-chart__table-toggle" onClick={() => setShowTable(!showTable)}>
          {showTable ? '收起数据表' : '查看数据表'}
        </button>
        <button className="i-chart__table-toggle" onClick={exportCsv}>
          导出 CSV
        </button>
      </div>
      {showTable && (
        <table className="i-chart__table">
          <thead>
            <tr>
              <th>{title || '类别'}</th>
              {series.map((s) => (
                <th key={`th-${s.name}`}>{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={`tr-${label}-${i}`}>
                <td>{label}</td>
                {series.map((s) => (
                  <td key={`td-${s.name}-${i}`}>
                    {formatTick(s.data[i] ?? 0)}
                    {unit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  )
}
