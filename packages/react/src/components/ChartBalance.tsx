import type { BalanceModel } from '@i-design/common'

export interface ChartBalanceProps {
  /** buildBalance 生成的同源模型，可直接序列化给其他端 */
  model: BalanceModel
  title?: string
  selectedId?: string
  rowHeight?: number
  onSelect?: (id: string) => void
  className?: string
}

export function ChartBalance({
  model,
  title = '贡献',
  selectedId = '',
  rowHeight = 32,
  onSelect,
  className = ''
}: ChartBalanceProps) {
  const span = model.max - model.min || 1
  const pos = (value: number) => ((value - model.min) / span) * 100
  const zero = pos(0)
  const bar = (step: BalanceModel['steps'][number]) => {
    const a = pos(Math.min(step.from, step.to))
    const b = pos(Math.max(step.from, step.to))
    return { insetInlineStart: `${a}%`, width: `${Math.max(b - a, 0.6)}%` }
  }

  return (
    <figure className={`i-balance ${className}`.trim()}>
      <figcaption className="i-balance__title">{title}</figcaption>
      <p className="i-balance__caption">{model.caption}</p>
      {model.state === 'ready' && (
        <>
          <ol className="i-balance__plot" aria-label={`${title}：${model.caption}`}>
            {model.steps.map((step) => (
              <li key={step.id} className="i-balance__row" style={{ minHeight: `${rowHeight}px` }}>
                <button
                  type="button"
                  className={`i-balance__pick${step.id === selectedId ? ' is-selected' : ''}`}
                  aria-label={step.description}
                  aria-pressed={step.id === selectedId}
                  onClick={() => onSelect?.(step.id)}
                >
                  <span className="i-balance__label">{step.label}</span>
                  <span className="i-balance__track">
                    {/* 零线要画出来：负的那一段从哪儿开始，看的就是它 */}
                    <span className="i-balance__zero" style={{ insetInlineStart: `${zero}%` }} aria-hidden="true" />
                    <span className={`i-balance__bar is-${step.kind} is-${step.direction}`} style={bar(step)} />
                  </span>
                  <span className="i-balance__value">{step.valueText}</span>
                  <span className="i-balance__cumulative">{step.cumulativeText}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="i-balance__caption">
            柱子从上一项的累计画起；右边两列是本项的增减与之后的累计。坐标轴含 0，负的那一段画在零线左边。
          </p>
        </>
      )}
      {model.excluded.length > 0 && (
        <ul className="i-balance__issues" aria-label="未计入的项目">
          {model.excluded.map((row) => (
            <li key={row.id}>
              源行 {row.sourceIndex + 1} · {row.label}：{row.reason}
            </li>
          ))}
        </ul>
      )}
    </figure>
  )
}
