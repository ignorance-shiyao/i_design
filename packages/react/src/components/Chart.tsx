import { useMemo, useRef, useState, type MouseEvent } from 'react'
import { useConfig } from './ConfigProvider'
import {
  areaPath,
  bandPath,
  domainOf,
  formatTick,
  linePath,
  percentStack,
  stepPath,
  targetProgress,
  niceTicks,
  scaleX,
  scaleY,
  type ChartSeries,
  type ChartThreshold,
  labelStep,
  showLabelAt,
  barRect,
  categoryBands,
  rankOrder,
  valueAxis
} from '@i-design/common'

export interface ChartProps {
  /**
   * 是否自带「数据表 / 导出」出口。
   *
   * 外面套了 ChartFrame 时要关掉：那一层的出口是按数据集出的，
   * 对所有图型都有；两个出口并排摆着，读者只会疑惑该点哪一个。
   */
  exits?: boolean
  /**
   * 百分比堆叠：每一列换算成占比。
   *
   * 分母有两种情况不换算并在图注里说明：整列为 0（没有分母）、
   * 列里有负数（「占总量的百分之多少」这句话本身不成立）。
   */
  percent?: boolean
  /**
   * 折线的画法。step 适合「值在两次采样之间保持不变」的量——
   * 库存、在线人数、档位。用折线画会让读者以为中间在连续变化。
   */
  curve?: 'linear' | 'step'
  /** 目标线：要达到的值。与阈值分开——把目标画成危险色会让它看起来像故障 */
  target?: { value: number; label?: string } | null
  /** 每个系列一条线／一组柱；系列顺序即取色顺序 */
  series: ChartSeries[]
  labels: string[]
  type?: 'line' | 'area' | 'bar'
  /** 柱状图专用：堆叠而不是并排 */
  stacked?: boolean
  /**
   * 柱状图的方向。horizontal 把值轴放到水平方向、类目轴放到垂直方向。
   *
   * 类目名一长，纵向柱的标签只能斜排或者隔一个显示；横条的标签正着写，
   * 长名字也读得下去。其它图型忽略它——折线横过来读者会把「时间」读成「量」。
   */
  orientation?: 'vertical' | 'horizontal'
  /**
   * 横条按值排序。横条多数时候是排名；但类目本身有顺序（星期、档位）时
   * 排序反而破坏信息，所以不是默认。
   */
  rank?: 'desc' | 'asc' | 'none'
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
  exits = true,
  percent = false,
  curve = 'linear',
  target = null,
  stacked = false,
  orientation = 'vertical',
  rank = 'none',
  height = 240,
  fromZero = true,
  labelLast = true,
  title = '',
  unit = '',
  thresholds = [],
  className = ''
}: ChartProps) {
  /* 文案走字典：数据表是图表的无障碍出口，按钮与表头也得跟着换语言 */
  const { locale } = useConfig()
  const root = useRef<HTMLElement>(null)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const rawVisible = series.filter((s) => !hidden.has(s.name))
  /* 百分比堆叠在这里换算：换算不了的列原样保留，并由 percentSkipped 报出来 */
  const percentResult = percent ? percentStack(rawVisible) : { series: rawVisible, skipped: [] }
  const visible = percentResult.series
  const percentSkipped = percentResult.skipped
  /** 目标达成情况，供图注与读屏用 */
  const goal = target ? targetProgress(visible, target.value) : null
  const isBar = type === 'bar'
  const isStackedBar = isBar && stacked
  const stackedArea = type === 'area' && visible.length > 1

  const horizontal = isBar && orientation === 'horizontal'
  const pad = {
    top: 16,
    right: labelLast && !isBar ? 96 : 16,
    bottom: 28,
    // 横条的类目名写在左边，48px 只够放数字刻度
    left: horizontal ? 110 : 48
  }
  const plotW = W - pad.left - pad.right
  /*
   * 轴标签抽稀：标签一多就会互相压住，糊成一条黑边——那既读不出内容，
   * 也让人误以为轴上有一根粗线。
   */
  const tickStep = labelStep(labels.length, plotW)
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

  /* ---------- 横条 ----------
   * 轴系走 @i-design/common 的 axis，与 Vue 端同一份：
   * 横纵共用同一套刻度，同一份数据横过来刻度密度不会变。
   */
  const hAxis = valueAxis(domain.min, domain.max, plotW, 'horizontal', { format: formatTick })
  const hBands = categoryBands(labels.length, plotH)
  const hOrder = rankOrder(
    labels.map((_, i) => visible.reduce((sum, s) => sum + (s.data[i] ?? 0), 0)),
    rank
  )
  const hThickness = isStackedBar
    ? (hBands[0]?.size ?? 0) * 0.5
    : ((hBands[0]?.size ?? 0) * 0.62) / Math.max(1, visible.length)
  const hx = (value: number) =>
    pad.left + ((value - hAxis.min) / (hAxis.max - hAxis.min || 1)) * plotW
  const hBars = visible.flatMap((s, si) =>
    hOrder.map((dataIndex, row) => {
      const band = hBands[row]
      const value = s.data[dataIndex] ?? 0
      const base = isStackedBar ? below(dataIndex, si) : 0
      const offsetInBand = isStackedBar
        ? (band.size - hThickness) / 2
        : (band.size - hThickness * visible.length) / 2 + si * hThickness
      const rect = barRect(
        { band, thickness: hThickness, offsetInBand },
        { from: hx(base), to: hx(base + value) },
        'horizontal'
      )
      return {
        key: `${s.name}-${dataIndex}`,
        name: s.name,
        dataIndex,
        x: rect.x,
        y: rect.y + pad.top,
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        // 堆叠时只有最外面一段收圆角：中间段也圆会看起来像一颗颗独立的胶囊
        rounded: !isStackedBar || si === visible.length - 1
      }
    })
  )
  /*
   * 阈值目前只画在纵向上：横条的阈值是一条竖线，会被读成分隔栏。
   * 没实现就明说，不静默丢掉。
   */
  const thresholdsDropped = horizontal && thresholds.length > 0

  /* 超出值域的阈值静默丢弃：压到边缘会让读者误以为「刚好卡在临界」 */
  const marks = (horizontal ? [] : thresholds)
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
    const head = [title || locale.chartCategory, ...series.map((s) => s.name)]
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
    if (horizontal) {
      // 横条的命中走垂直方向；落在第几条带上要按排序后的顺序反查回数据下标
      const row = Math.floor(
        (((event.clientY - rect.top) / rect.height) * height - pad.top) /
          Math.max(1, hBands[0]?.size ?? 1)
      )
      setActive(hOrder[Math.min(labels.length - 1, Math.max(0, row))] ?? null)
      return
    }
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
        {!horizontal &&
          ticks.map((tick) => (
            <g key={tick}>
              <line className="i-chart__grid" x1={pad.left} x2={W - pad.right} y1={y(tick)} y2={y(tick)} />
              <text className="i-chart__tick" x={pad.left - 8} y={y(tick) + 4} textAnchor="end">
                {formatTick(tick)}
              </text>
            </g>
          ))}
        {!horizontal && (
          <line
            className="i-chart__axis"
            x1={pad.left}
            x2={W - pad.right}
            y1={y(Math.max(scale.min, 0))}
            y2={y(Math.max(scale.min, 0))}
          />
        )}

        {/* 横条：网格竖着画、刻度写在下沿、类目名正着写在左边 */}
        {horizontal && (
          <>
            {hAxis.ticks.map((tick) => (
              <g key={`h-${tick.value}`}>
                <line
                  className="i-chart__grid"
                  x1={pad.left + tick.offset}
                  x2={pad.left + tick.offset}
                  y1={pad.top}
                  y2={pad.top + plotH}
                />
                <text
                  className="i-chart__tick"
                  x={pad.left + tick.offset}
                  y={height - 8}
                  textAnchor="middle"
                >
                  {tick.label}
                </text>
              </g>
            ))}
            <line
              className="i-chart__axis"
              x1={pad.left + hAxis.baseline}
              x2={pad.left + hAxis.baseline}
              y1={pad.top}
              y2={pad.top + plotH}
            />
            {hOrder.map((row, i) => (
              <text
                key={`h-label-${row}`}
                className="i-chart__tick"
                x={pad.left - 10}
                y={pad.top + hBands[i].center + 4}
                textAnchor="end"
              >
                {labels[row]}
              </text>
            ))}
          </>
        )}

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

        {!horizontal && labels.map((label, i) => (
          <text
            key={`${label}-${i}`}
            className="i-chart__tick"
            x={isBar ? pad.left + bandWidth * (i + 0.5) : x(i)}
            y={height - 8}
            textAnchor="middle"
            /*
              抽稀走共享的 labelStep：原本是「超过 12 个就隔一个隐藏」，
              90 个标签时仍会糊成一条黑边，而且与 Vue 端的规则对不上。
            */
            opacity={showLabelAt(i, labels.length, tickStep) ? 1 : 0}
          >
            {label}
          </text>
        ))}

        {horizontal
          ? hBars.map((bar) => (
              <rect
                key={bar.key}
                className="i-chart__bar"
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={colorOf(bar.name)}
                rx={bar.rounded ? 3 : 0}
                opacity={active === null || active === bar.dataIndex ? 1 : 0.55}
              />
            ))
          : null}

        {isBar && !horizontal
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
                d={
                  curve === 'step'
                    ? stepPath(s.data, scale.min, scale.max, plotW, plotH)
                    : linePath(s.data, scale.min, scale.max, plotW, plotH)
                }
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
        {target && horizontal ? (
          <g>
            <line
              className="i-chart__target-line"
              x1={hx(target.value)}
              x2={hx(target.value)}
              y1={pad.top}
              y2={pad.top + plotH}
            />
            <text
              className="i-chart__target-label"
              x={hx(target.value)}
              y={pad.top - 4}
              textAnchor="middle"
            >
              {target.label || `目标 ${target.value}`}
            </text>
          </g>
        ) : null}
        {target && !horizontal ? (
          <g>
            <line
              className="i-chart__target-line"
              x1={pad.left}
              x2={W - pad.right}
              y1={y(target.value)}
              y2={y(target.value)}
            />
            <text
              className="i-chart__target-label"
              x={W - pad.right}
              y={y(target.value) - 4}
              textAnchor="end"
            >
              {target.label || `目标 ${target.value}`}
            </text>
          </g>
        ) : null}
      </svg>

      {active !== null && (
        <div
          className="i-chart__tooltip"
          style={{
            left: horizontal
              ? `${(((pad.left + plotW / 2) / W) * 100).toFixed(2)}%`
              : `${(((isBar ? pad.left + bandWidth * (active + 0.5) : x(active)) / W) * 100).toFixed(2)}%`,
            top: horizontal
              ? `${(((pad.top + (hBands[hOrder.indexOf(active)]?.center ?? 0) - 8) / height) * 100).toFixed(2)}%`
              : `${((y(scale.max) / height) * 100).toFixed(2)}%`
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

      {/*
        目标线：与阈值分开画。阈值说的是「越过就有问题」，目标说的是「要达到」——
        用危险色画目标，会让一个还没达成的目标看起来像一次故障。
      */}
      {/* 换算不了的列与目标达成情况都写出来，不让读者自己看出来 */}
      {thresholdsDropped ? (
        <p className="i-chart__hint">
          横条暂不画阈值线：竖着的阈值线会被读成分隔栏。需要阈值请用纵向柱状图。
        </p>
      ) : null}
      {percentSkipped.length ? (
        <p className="i-chart__hint">
          {`有 ${percentSkipped.length} 列没有换算成百分比：`}
          {percentSkipped.some((c) => c.reason === 'zero-total') ? '整列为 0 时没有分母；' : ''}
          {percentSkipped.some((c) => c.reason === 'has-negative')
            ? '含负值时「占总量的百分之多少」不成立。'
            : ''}
        </p>
      ) : null}
      {goal ? (
        <p className="i-chart__hint">{goal.reached ? '已达成目标' : `距目标还差 ${goal.gap}`}</p>
      ) : null}

      {exits ? (
      <div className="i-chart__actions">
        <button className="i-chart__table-toggle" onClick={() => setShowTable(!showTable)}>
          {showTable ? locale.chartTableHide : locale.chartTableShow}
        </button>
        <button className="i-chart__table-toggle" onClick={exportCsv}>
          导出 CSV
        </button>
      </div>
      ) : null}
      {exits && showTable && (
        <table className="i-chart__table">
          <thead>
            <tr>
              <th>{title || locale.chartCategory}</th>
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
