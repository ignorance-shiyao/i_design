import type { RealtimeModel } from '@i-design/common'

export interface ChartRealtimeProps {
  /** buildRealtimeWindow 生成的同源模型，可直接序列化给其他端 */
  model: RealtimeModel
  title?: string
  selectedIndex?: number | null
  height?: number
  onSelect?: (index: number) => void
  className?: string
}

export function ChartRealtime({
  model,
  title = '实时滑窗',
  selectedIndex = null,
  height = 180,
  onSelect,
  className = ''
}: ChartRealtimeProps) {
  const span = model.max - model.min || 1
  const yOf = (value: number) => 100 - ((value - model.min) / span) * 100
  const xOf = (index: number, count: number) => (count <= 1 ? 50 : (index / (count - 1)) * 100)

  const segments: string[] = []
  let points: string[] = []
  model.buckets.forEach((bucket, index) => {
    if (bucket.state === 'gap' || bucket.value === null) {
      if (points.length) segments.push(points.join(' '))
      points = []
      return
    }
    points.push(`${xOf(index, model.buckets.length)},${yOf(bucket.value)}`)
  })
  if (points.length) segments.push(points.join(' '))

  const gapBands = model.buckets
    .map((bucket, index) => ({ bucket, index }))
    .filter((row) => row.bucket.state === 'gap')
    .map(({ index }) => {
      const count = model.buckets.length
      const left = count <= 1 ? 0 : ((index - 0.5) / (count - 1)) * 100
      const right = count <= 1 ? 100 : ((index + 0.5) / (count - 1)) * 100
      return { index, x: Math.max(0, left), width: Math.min(100, right) - Math.max(0, left) }
    })

  const gapCount = model.buckets.filter((bucket) => bucket.state === 'gap').length
  const zeroY = yOf(0)

  return (
    <figure className={`i-realtime ${className}`.trim()}>
      <figcaption className="i-realtime__title">{title}</figcaption>
      <p className="i-realtime__caption">{model.caption}</p>
      <p className="i-realtime__basis">口径：{model.basis}</p>

      <div className="i-realtime__status" aria-label="运行状态">
        <span className={`i-realtime__chip${model.paused ? ' is-paused' : ' is-live'}`}>
          {model.paused ? '已暂停' : '直播中'}
        </span>
        <span className="i-realtime__chip">{model.lagText}</span>
        {gapCount > 0 && (
          <span className="i-realtime__chip is-gap">{gapCount} 个断流空档</span>
        )}
      </div>

      {model.state === 'ready' && (
        <>
          <div className="i-realtime__plot">
            <svg
              className="i-realtime__svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ height }}
              role="img"
              aria-label={`${title}。${model.caption}。${model.basis}`}
            >
              {[0, 25, 50, 75, 100].map((y) => (
                <line key={y} className="i-realtime__grid" x1="0" x2="100" y1={y} y2={y} />
              ))}
              <line className="i-realtime__zero" x1="0" x2="100" y1={zeroY} y2={zeroY} />
              {gapBands.map((band) => (
                <g key={`gap-${band.index}`}>
                  <rect className="i-realtime__gap" x={band.x} y="0" width={Math.max(band.width, 1)} height="100" />
                  <text className="i-realtime__gap-label" x={band.x + band.width / 2} y="14" textAnchor="middle">
                    断流
                  </text>
                </g>
              ))}
              {model.marks.map((mark) => (
                <line
                  key={`mark-${mark.id}`}
                  className="i-realtime__mark"
                  x1={xOf(mark.bucketIndex, model.buckets.length)}
                  x2={xOf(mark.bucketIndex, model.buckets.length)}
                  y1="0"
                  y2="100"
                />
              ))}
              {model.marks.map((mark) => (
                <text
                  key={`mark-label-${mark.id}`}
                  className="i-realtime__mark-label"
                  x={xOf(mark.bucketIndex, model.buckets.length) + 1}
                  y="26"
                >
                  {mark.label}
                </text>
              ))}
              {segments.map((line, i) => (
                <polyline key={i} className="i-realtime__line" points={line} />
              ))}
              {model.buckets.map((bucket, index) =>
                bucket.state === 'ready' && bucket.value !== null ? (
                  <circle
                    key={`pt-${index}`}
                    className={`i-realtime__point${selectedIndex === index ? ' is-selected' : ''}`}
                    cx={xOf(index, model.buckets.length)}
                    cy={yOf(bucket.value)}
                    r="1.6"
                  />
                ) : null
              )}
            </svg>
          </div>

          <ol className="i-realtime__buckets" aria-label="各桶数值">
            {model.buckets.map((bucket) => (
              <li key={bucket.index}>
                <button
                  type="button"
                  className={`i-realtime__bucket${selectedIndex === bucket.index ? ' is-selected' : ''}${bucket.state === 'gap' ? ' is-gap' : ''}`}
                  aria-label={bucket.description}
                  aria-pressed={selectedIndex === bucket.index}
                  onClick={() => onSelect?.(bucket.index)}
                >
                  <span className="i-realtime__bucket-state">
                    {bucket.state === 'gap' ? '断流' : `桶 ${bucket.index + 1}`}
                  </span>
                  <span className="i-realtime__bucket-value">{bucket.valueText}</span>
                  <span className="i-realtime__sr">{bucket.description}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="i-realtime__note">
            折线在断流空档处断开，不把空档连成斜线。下方每个桶都可以选中；断流桶标着「断流」，不是 0。
          </p>
        </>
      )}

      {(model.late.length > 0 || model.excluded.length > 0) && (
        <ul className="i-realtime__issues" aria-label="未入窗或未计入的点">
          {model.late.map((row) => (
            <li key={`late-${row.id}`}>未入窗 · {row.id}：{row.reason}</li>
          ))}
          {model.excluded.map((row) => (
            <li key={`ex-${row.id}`}>未计入 · 源行 {row.sourceIndex + 1} · {row.id}：{row.reason}</li>
          ))}
        </ul>
      )}
    </figure>
  )
}
