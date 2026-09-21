import { retentionShade, type RetentionModel } from '@i-design/common'

export interface ChartRetentionProps {
  /** buildRetention 生成的同源模型，可直接序列化给其他端 */
  model: RetentionModel
  title?: string
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
}

export function ChartRetention({
  model,
  title = '留存',
  selectedId = '',
  onSelect,
  className = ''
}: ChartRetentionProps) {
  const columns = Array.from({ length: model.periods }, (_, i) => i + 1)
  const cellAt = (cohortId: string, period: number) =>
    model.cohorts.find((cohort) => cohort.id === cohortId)?.cells.find((cell) => cell.period === period)

  /*
   * 色阶的五档都自带配好的字色，深浅与字色一起换。
   * 未到期留空——最浅那一档是「几乎没人留下」，和「这一期还没到」是两回事。
   */
  const shadeClass = (cohortId: string, period: number) => {
    const cell = cellAt(cohortId, period)
    const step = cell ? retentionShade(cell) : null
    return step === null ? 'is-pending' : `is-s${step}`
  }

  return (
    <figure className={`i-retention ${className}`.trim()}>
      <figcaption className="i-retention__title">{title}</figcaption>
      <p className="i-retention__caption">{model.caption}</p>
      <p className="i-retention__basis">口径：{model.basis}。空格表示这一期还没到，不是 0。</p>
      {model.state === 'ready' && (
        <>
          <div className="i-retention__scroll">
            <table className="i-retention__table">
              <caption className="i-retention__sr">
                {title}：{model.caption}。{model.basis}
              </caption>
              <thead>
                <tr>
                  <th scope="col">批次</th>
                  <th scope="col">期初</th>
                  {columns.map((period) => (
                    <th key={period} scope="col">
                      第 {period} 期
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.cohorts.map((cohort) => (
                  <tr key={cohort.id} className={cohort.id === selectedId ? 'is-selected' : undefined}>
                    <th scope="row">
                      <button
                        type="button"
                        className="i-retention__pick"
                        aria-pressed={cohort.id === selectedId}
                        onClick={() => onSelect?.(cohort.id)}
                      >
                        {cohort.label}
                      </button>
                    </th>
                    <td className="i-retention__size">{cohort.sizeText}</td>
                    {columns.map((period) => (
                      <td key={period} className={`i-retention__cell ${shadeClass(cohort.id, period)}`}>
                        <span className="i-retention__value">{cellAt(cohort.id, period)?.rateText ?? '—'}</span>
                        <span className="i-retention__sr">{cellAt(cohort.id, period)?.description}</span>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="i-retention__average">
                  <th scope="row">各期平均</th>
                  <td className="i-retention__size">—</td>
                  {model.averages.map((average) => (
                    <td key={average.period} className={average.comparable ? undefined : 'is-partial'}>
                      <span className="i-retention__value">{average.rateText}</span>
                      {!average.comparable && (
                        <span className="i-retention__flag">
                          {average.cohorts} / {model.cohorts.length} 批
                        </span>
                      )}
                      <span className="i-retention__sr">{average.description}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {model.averages.some((average) => !average.comparable) && (
            <p className="i-retention__caption">
              标着「N / M 批」的那几期只有部分批次到得了，是幸存者平均，不能和左边几期比。
            </p>
          )}
        </>
      )}
      {model.excluded.length > 0 && (
        <ul className="i-retention__issues" aria-label="未计入的批次">
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
