import { useChartWidth } from './useChartWidth'
/**
 * 分布图：直方、密度、小提琴、误差棒（astra.md 的 D04）。
 *
 * 把三个会改变结论的数字印在图上，而不是留给读者猜：分箱规则与箱宽、
 * 核密度带宽、误差棒到底是标准差还是置信区间。计算全在公共层，与 Vue 端同一份。
 */
import {
  errorBar,
  formatTick,
  histogram,
  kde,
  niceTicks,
  violinShape,
  type ErrorKind
} from '@i-design/common'

export interface ChartDistributionProps {
  /** 原始样本。分布图吃的是样本本身，不是聚合过的值 */
  values: number[]
  type?: 'histogram' | 'density' | 'violin' | 'error'
  /** 分箱规则。fixed 时必须给 binWidth */
  rule?: 'freedman-diaconis' | 'sturges' | 'fixed'
  binWidth?: number
  /** 核密度带宽。不给则按 Silverman 经验法则算 */
  bandwidth?: number
  /** 误差棒的含义：三者说的不是一回事 */
  errorKind?: ErrorKind
  height?: number
  title?: string
  unit?: string
  className?: string
}


const PAD = { top: 16, right: 16, bottom: 36, left: 52 }

export function ChartDistribution({
  values,
  type = 'histogram',
  rule = 'freedman-diaconis',
  binWidth,
  bandwidth,
  errorKind = 'sd',
  height = 260,
  title = '',
  unit = '',
  className = ''
}: ChartDistributionProps) {
  const { ref: host, width: W } = useChartWidth<HTMLElement>()
  const plotW = W - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom

  const hist = type === 'histogram' ? histogram(values, { rule, width: binWidth }) : null
  const density = type === 'density' ? kde(values, { bandwidth }) : null
  const violin = type === 'violin' ? violinShape(values, { bandwidth }) : null
  const bar = type === 'error' ? errorBar(values, errorKind) : null

  const finite = values.filter((v) => Number.isFinite(v))
  const domain = (() => {
    if (!finite.length) return { min: 0, max: 1 }
    if (bar) return { min: Math.min(...finite, bar.low), max: Math.max(...finite, bar.high) }
    if (density?.points.length) {
      return { min: density.points[0].x, max: density.points[density.points.length - 1].x }
    }
    return { min: Math.min(...finite), max: Math.max(...finite) }
  })()

  const ticks = niceTicks(domain.min, domain.max, 5)
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const x = (v: number) => PAD.left + ((v - lo) / (hi - lo || 1)) * plotW

  const maxCount = Math.max(1, ...(hist?.bins ?? []).map((b) => b.count))
  const peak = Math.max(
    1e-9,
    ...(density?.points ?? []).map((p) => p.y),
    ...(violin?.points ?? []).map((p) => p.density)
  )
  const mid = PAD.top + plotH / 2

  const densityPath = (density?.points ?? [])
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.x).toFixed(2)} ${(PAD.top + plotH - (p.y / peak) * plotH).toFixed(2)}`)
    .join(' ')

  /** 小提琴：同一条密度上下对称，宽度按 peak 归一化，两把琴的「胖」才可比 */
  const violinPath = (() => {
    const points = violin?.points ?? []
    if (!points.length) return ''
    const half = (d: number) => (d / peak) * (plotH / 2)
    const top = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.value).toFixed(2)} ${(mid - half(p.density)).toFixed(2)}`)
    const bottom = [...points].reverse().map((p) => `L${x(p.value).toFixed(2)} ${(mid + half(p.density)).toFixed(2)}`)
    return `${top.join(' ')} ${bottom.join(' ')} Z`
  })()

  const caption = (() => {
    if (hist) {
      const ruleName =
        hist.rule === 'freedman-diaconis' ? 'Freedman–Diaconis' : hist.rule === 'sturges' ? 'Sturges' : '固定宽度'
      return `${hist.count} 个样本，${hist.bins.length} 个箱，箱宽 ${formatTick(hist.width)}${unit}（${ruleName}）`
    }
    if (density) return `${values.length} 个样本，带宽 ${formatTick(density.bandwidth)}${unit}（Silverman）`
    if (violin) return `${values.length} 个样本，带宽 ${formatTick(violin.bandwidth)}${unit}；宽度按峰值归一化`
    if (bar) return bar.caption
    return ''
  })()

  const issues = [...(hist?.issues ?? []), ...(density?.issues ?? []), ...(violin?.issues ?? [])]

  return (
    <figure ref={host} className={['i-chart-dist', className].filter(Boolean).join(' ')}>
      {title && <figcaption className="i-chart-dist__title">{title}</figcaption>}

      <svg
        className="i-chart-dist__svg"
        viewBox={`0 0 ${W} ${height}`}
        style={{ height }}
        role="img"
        aria-label={`${title || '分布图'}：${caption}`}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line className="i-chart-dist__grid" x1={x(tick)} x2={x(tick)} y1={PAD.top} y2={PAD.top + plotH} />
            <text className="i-chart-dist__tick" x={x(tick)} y={height - 12} textAnchor="middle">
              {formatTick(tick)}
            </text>
          </g>
        ))}

        {/* 直方：相邻箱之间留一像素缝，色觉障碍下它比颜色更可靠 */}
        {hist?.bins.map((binItem, i) => (
          <rect
            key={i}
            className="i-chart-dist__bar"
            x={x(binItem.from) + 0.5}
            y={PAD.top + plotH - (binItem.count / maxCount) * plotH}
            width={Math.max(1, x(binItem.to) - x(binItem.from) - 1)}
            height={(binItem.count / maxCount) * plotH}
          />
        ))}

        {density && <path className="i-chart-dist__line" d={densityPath} />}
        {violin && <path className="i-chart-dist__violin" d={violinPath} />}

        {/* 误差棒：中心是均值，两端是那句图注说的量 */}
        {bar && (
          <g>
            <line className="i-chart-dist__whisker" x1={x(bar.low)} x2={x(bar.high)} y1={mid} y2={mid} />
            <line className="i-chart-dist__cap" x1={x(bar.low)} x2={x(bar.low)} y1={mid - 10} y2={mid + 10} />
            <line className="i-chart-dist__cap" x1={x(bar.high)} x2={x(bar.high)} y1={mid - 10} y2={mid + 10} />
            <circle className="i-chart-dist__mean" cx={x(bar.mean)} cy={mid} r={5} />
          </g>
        )}
      </svg>

      {/* 会改变结论的数字写在图下：分箱宽度、带宽、误差棒的含义 */}
      <p className="i-chart-dist__caption">{caption}</p>
      {issues.map((issue) => (
        <p className="i-chart-dist__issue" role="status" key={issue.kind}>
          {issue.message}
        </p>
      ))}
    </figure>
  )
}
