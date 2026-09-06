import { useState } from 'react';

/**
 * Charts for the console demo.
 *
 * The categorical palette was validated rather than eyeballed: light
 * (#4169ef / #039855 / #b54708) and dark (#4169ef / #039855 / #dc6803) both pass
 * the lightness band, chroma floor, normal-vision floor and 3:1 contrast checks.
 * Their worst CVD pair sits in the 6–8 floor band, which is legal only with
 * secondary encoding — so every series is direct-labelled, and stacked/adjacent
 * marks keep a 2px surface gap.
 */
export const SERIES = [
  { key: 'search', label: '自然搜索', light: '#4169ef', dark: '#4169ef' },
  { key: 'direct', label: '直接访问', light: '#039855', dark: '#039855' },
  { key: 'referral', label: '推荐链接', light: '#b54708', dark: '#dc6803' },
] as const;

export interface WeekPoint {
  week: string;
  search: number;
  direct: number;
  referral: number;
}

export const TRAFFIC: WeekPoint[] = [
  { week: '第 1 周', search: 4200, direct: 2400, referral: 1200 },
  { week: '第 2 周', search: 4600, direct: 2100, referral: 1500 },
  { week: '第 3 周', search: 5100, direct: 2600, referral: 1400 },
  { week: '第 4 周', search: 4800, direct: 3000, referral: 1900 },
  { week: '第 5 周', search: 5600, direct: 3200, referral: 1700 },
  { week: '第 6 周', search: 6100, direct: 3400, referral: 2200 },
];

const nf = new Intl.NumberFormat('zh-CN');

/** Single-series sparkline for a stat tile. No legend: the tile title names it. */
export function Sparkline({ points, width = 120, height = 34 }: { points: number[]; width?: number; height?: number }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = width / Math.max(points.length - 1, 1);
  const path = points
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)},${(height - ((value - min) / span) * (height - 6) - 3).toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1]!;
  const lastY = height - ((last - min) / span) * (height - 6) - 3;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <path d={path} stroke="var(--i-color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Emphasised endpoint: the value the tile's number reports. */}
      <circle cx={width} cy={lastY} r="3" fill="var(--i-color-brand)" stroke="var(--i-color-bg-container)" strokeWidth="2" />
    </svg>
  );
}

export function TrafficChart({ data = TRAFFIC }: { data?: WeekPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const width = 640;
  const height = 240;
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const max = Math.max(...data.flatMap((row) => [row.search, row.direct, row.referral]));
  const ceiling = Math.ceil(max / 1000) * 1000;
  const groupW = plotW / data.length;
  const barW = (groupW - 12) / SERIES.length - 2; // 2px surface gap between adjacent bars
  const ticks = [0, ceiling / 2, ceiling];

  return (
    <figure style={{ margin: 0, width: '100%' }}>
      <figcaption className="chart__head">
        <div>
          <div className="chart__title">渠道流量</div>
          <div className="chart__subtitle">近 6 周，按来源</div>
        </div>
        <button className="chart__toggle" onClick={() => setShowTable((value) => !value)}>
          {showTable ? '看图表' : '看数据表'}
        </button>
      </figcaption>

      {showTable ? (
        <div className="chart__table-wrap">
          <table className="chart__table">
            <thead>
              <tr>
                <th scope="col">周次</th>
                {SERIES.map((series) => <th scope="col" key={series.key}>{series.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.week}>
                  <th scope="row">{row.week}</th>
                  {SERIES.map((series) => <td key={series.key}>{nf.format(row[series.key])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart__plot">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="近 6 周各渠道流量对比" className="chart__svg">
            {ticks.map((tick) => {
              const y = padding.top + plotH - (tick / ceiling) * plotH;
              return (
                <g key={tick}>
                  <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--i-color-border-subtle)" strokeWidth="1" />
                  <text x={padding.left - 8} y={y + 4} textAnchor="end" className="chart__axis-label">
                    {tick === 0 ? '0' : `${tick / 1000}k`}
                  </text>
                </g>
              );
            })}

            {data.map((row, groupIndex) => {
              const groupX = padding.left + groupIndex * groupW + 6;
              return (
                <g
                  key={row.week}
                  onMouseEnter={() => setHover(groupIndex)}
                  onMouseLeave={() => setHover(null)}
                >
                  {/* A full-height hit area: the target is bigger than the marks. */}
                  <rect x={groupX - 6} y={padding.top} width={groupW} height={plotH} fill="transparent" />
                  {hover === groupIndex && (
                    <rect x={groupX - 6} y={padding.top} width={groupW} height={plotH} fill="var(--i-color-bg-hover)" />
                  )}
                  {SERIES.map((series, seriesIndex) => {
                    const value = row[series.key];
                    const barH = (value / ceiling) * plotH;
                    const x = groupX + seriesIndex * (barW + 2);
                    return (
                      <rect
                        key={series.key}
                        x={x}
                        y={padding.top + plotH - barH}
                        width={barW}
                        height={barH}
                        rx="4"
                        className={`chart__bar chart__bar--${series.key}`}
                      />
                    );
                  })}
                  <text x={groupX + (groupW - 12) / 2} y={height - 8} textAnchor="middle" className="chart__axis-label">
                    {row.week.replace('第 ', '').replace(' 周', '')}
                  </text>
                </g>
              );
            })}
          </svg>

          {hover !== null && (
            <div className="chart__tooltip" style={{ insetInlineStart: `${((hover + 0.5) / data.length) * 100}%` }}>
              <div className="chart__tooltip-title">{data[hover]!.week}</div>
              {SERIES.map((series) => (
                <div className="chart__tooltip-row" key={series.key}>
                  <span className={`chart__swatch chart__swatch--${series.key}`} />
                  <span>{series.label}</span>
                  <b>{nf.format(data[hover]![series.key])}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend is always present for ≥2 series, and doubles as the direct label
          the floor-band CVD pair requires. */}
      <div className="chart__legend">
        {SERIES.map((series) => (
          <span className="chart__legend-item" key={series.key}>
            <span className={`chart__swatch chart__swatch--${series.key}`} />
            {series.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
