import type { ParetoModel } from '@i-design/common'

export interface ChartParetoProps {
  model: ParetoModel
  title?: string
  selectedId?: string
  height?: number
  onSelect?: (id: string) => void
  className?: string
}
export function ChartPareto({ model, title = '帕累托图', selectedId = '', height = 220, onSelect, className = '' }: ChartParetoProps) {
  const points = model.rows.map(row => `${(row.rank - 0.5) * 100 / model.rows.length},${100 - (row.cumulative ?? 0) * 100}`).join(' ')
  return <figure className={`i-pareto ${className}`}>
    <figcaption className="i-pareto__title">{title}</figcaption>
    <p className="i-pareto__caption">{model.caption}</p>
    {model.state === 'ready' && <>
      <div className="i-pareto__legend"><span>柱形：0 — {model.maxText}</span><span>折线：累计占比 0 — 100%</span></div>
      <svg className="i-pareto__plot" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} role="img" aria-label={`${title}。${model.caption}。下方可按类别选择并读取数据。`}>
        {[0, 25, 50, 75, 100].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} className="i-pareto__grid" />)}
        {model.rows.map(row => <rect key={row.id} x={(row.rank - 1) * 100 / model.rows.length + 10 / model.rows.length} width={80 / model.rows.length} y={100 - row.relative * 100} height={row.relative * 100} className={`i-pareto__bar ${selectedId === row.id ? 'is-selected' : ''}`} onClick={() => onSelect?.(row.id)}><title>{row.description}</title></rect>)}
        <line x1="0" x2="100" y1={100 - model.threshold * 100} y2={100 - model.threshold * 100} className="i-pareto__threshold" />
        <polyline points={points} className="i-pareto__line" />
        {model.rows.map(row => <line key={`point-${row.id}`} x1={(row.rank - .5) * 100 / model.rows.length} x2={(row.rank - .5) * 100 / model.rows.length} y1={100 - (row.cumulative ?? 0) * 100} y2={100 - (row.cumulative ?? 0) * 100} className="i-pareto__point" />)}
      </svg>
      <div className="i-pareto__ranks" aria-hidden="true">{model.rows.map(row => <span key={row.id}>{row.rank}</span>)}</div>
      <p className="i-pareto__caption">虚线：{model.thresholdText} 累计阈值。序号对应下方类别；累计只表示数量构成，不说明因果。</p>
    </>}
    <ol className="i-pareto__data" aria-label="帕累托数据">{model.rows.map(row => <li key={row.id}>
      <button type="button" className="i-pareto__row" aria-label={row.description} aria-pressed={selectedId === row.id} onClick={() => onSelect?.(row.id)}>
        <span>{row.rank}. {row.label}{selectedId === row.id ? ' · 已选' : ''}</span>
        <span className="i-pareto__values">{row.valueText} · 占比 {row.shareText} · 累计 {row.cumulativeText} · 源行 {row.sourceIndex + 1}</span>
      </button>
    </li>)}</ol>
    {!!model.excluded.length && <ul className="i-pareto__issues" aria-label="未计入的类别">{model.excluded.map(row => <li key={row.id}>源行 {row.sourceIndex + 1} · {row.label}：{row.reason}</li>)}</ul>}
  </figure>
}
