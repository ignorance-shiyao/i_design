import { useMemo, useState } from 'react'
import { useConfig } from './ConfigProvider'
import { boxStats, formatTick, niceTicks, scaleY } from '@i-design/common'

export interface BoxGroup {
  label: string
  values: number[]
}

export interface ChartBoxProps {
  groups: BoxGroup[]
  title?: string
  height?: number
  /** 纵轴单位，跟在刻度后面 */
  unit?: string
}

const W = 640
const PAD = { top: 16, right: 16, bottom: 28, left: 48 }

export function ChartBox({ groups, title = '', height = 260, unit = '' }: ChartBoxProps) {
  /* 文案走字典：数据表是图表的无障碍出口，按钮与表头也得跟着换语言 */
  const { locale } = useConfig()
  const [active, setActive] = useState(-1)
  const [showTable, setShowTable] = useState(false)

  const plotW = W - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const stats = useMemo(
    () => groups.map((g) => ({ label: g.label, ...boxStats(g.values) })),
    [groups]
  )

  /*
   * 值域要把离群点也包进去：把它们裁到画布外，图上就看不出「有异常值」这件事，
   * 而那往往正是看箱线图的原因。
   */
  const scale = useMemo(() => {
    const finite = stats.flatMap((s) => [s.min, s.max]).filter((v) => Number.isFinite(v))
    if (!finite.length) return { ticks: [0, 1], min: 0, max: 1 }
    const ticks = niceTicks(Math.min(...finite), Math.max(...finite), 5)
    return { ticks, min: ticks[0], max: ticks[ticks.length - 1] }
  }, [stats])

  const y = (v: number) => scaleY(v, scale.min, scale.max, plotH) + PAD.top
  const band = plotW / Math.max(1, groups.length)
  /* 箱体占带宽的一半：留出的空白让相邻箱子不会看起来像连成一片 */
  const boxW = Math.min(56, band * 0.5)
  const center = (i: number) => PAD.left + band * (i + 0.5)

  return (
    <figure className="i-chart">
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <svg
        className="i-chart__svg"
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={title || '箱线图'}
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

        {stats.map((s, i) => (
          <g
            key={s.label}
            className={`i-box${active === i ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
          >
            {/* 须：延伸到 1.5×IQR 内的实测值，不是围栏位置 */}
            <line className="i-box__whisker" x1={center(i)} x2={center(i)} y1={y(s.upper)} y2={y(s.q3)} />
            <line className="i-box__whisker" x1={center(i)} x2={center(i)} y1={y(s.q1)} y2={y(s.lower)} />
            <line className="i-box__cap" x1={center(i) - boxW / 4} x2={center(i) + boxW / 4} y1={y(s.upper)} y2={y(s.upper)} />
            <line className="i-box__cap" x1={center(i) - boxW / 4} x2={center(i) + boxW / 4} y1={y(s.lower)} y2={y(s.lower)} />

            <rect
              className="i-box__body"
              x={center(i) - boxW / 2}
              y={y(s.q3)}
              width={boxW}
              height={Math.max(1, y(s.q1) - y(s.q3))}
              rx="2"
            />
            {/* 中位线加粗：它是箱子里唯一需要一眼读出的位置 */}
            <line className="i-box__median" x1={center(i) - boxW / 2} x2={center(i) + boxW / 2} y1={y(s.median)} y2={y(s.median)} />

            {s.outliers.map((o, oi) => (
              <circle key={oi} className="i-box__outlier" cx={center(i)} cy={y(o)} r="3" />
            ))}

            <text className="i-chart__tick" x={center(i)} y={height - 8} textAnchor="middle">
              {s.label}
            </text>
          </g>
        ))}
      </svg>

      {/* 悬停给出五数概括：箱子只表达相对位置，具体数值要能查得到 */}
      {active >= 0 && (
        <p className="i-box__readout">
          <strong>{stats[active].label}</strong>
          中位数 {formatTick(stats[active].median)}
          {unit} · 四分位 {formatTick(stats[active].q1)}–{formatTick(stats[active].q3)}
          {unit} · 范围 {formatTick(stats[active].lower)}–{formatTick(stats[active].upper)}
          {unit}
          {stats[active].outliers.length > 0 && ` · ${stats[active].outliers.length} 个离群点`}
        </p>
      )}

      {/* 数据表：图形之外的另一条读取路径，读屏与灰度打印都靠它 */}
      <button className="i-chart__table-toggle" onClick={() => setShowTable(!showTable)}>
        {showTable ? locale.chartTableHide : locale.chartTableShow}
      </button>
      {showTable && (
        <table className="i-chart__table">
          <thead>
            <tr><th>分组</th><th>最小</th><th>Q1</th><th>中位数</th><th>Q3</th><th>最大</th><th>离群点</th></tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.label}>
                <td>{s.label}</td>
                <td>{formatTick(s.min)}</td>
                <td>{formatTick(s.q1)}</td>
                <td>{formatTick(s.median)}</td>
                <td>{formatTick(s.q3)}</td>
                <td>{formatTick(s.max)}</td>
                <td>{s.outliers.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  )
}
