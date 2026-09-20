import { CHART_PALETTE_SIZE, hierarchyView, sunburstSectors, type HierarchyModel } from '@i-design/common'

export interface ChartSunburstProps {
  /** buildHierarchy 生成的同源模型，可直接序列化给其他端 */
  model: HierarchyModel
  title?: string
  /** 下钻焦点；为空表示看整棵树 */
  focusId?: string
  selectedId?: string
  size?: number
  onSelect?: (id: string) => void
  onFocus?: (id: string) => void
  className?: string
}

export function ChartSunburst({
  model,
  title = '旭日图',
  focusId = '',
  selectedId = '',
  size = 220,
  onSelect,
  onFocus,
  className = ''
}: ChartSunburstProps) {
  const view = hierarchyView(model, focusId || null)
  const sectors = sunburstSectors(view, { size })
  const focused = focusId ? model.nodes.find((node) => node.id === focusId) : undefined
  const centerText = focused ? focused.valueText : model.totalText

  return (
    <figure className={`i-sunburst ${className}`.trim()}>
      <figcaption className="i-sunburst__title">{title}</figcaption>
      <p className="i-sunburst__caption">{model.caption}</p>
      {model.state === 'ready' && (
        <>
          {focusId && (
            <p className="i-sunburst__crumb">
              <button type="button" className="i-sunburst__up" onClick={() => onFocus?.('')}>
                返回全部
              </button>
              <span>当前只看：{focused?.label}</span>
            </p>
          )}
          <svg
            className="i-sunburst__plot"
            viewBox={`0 0 ${size} ${size}`}
            style={{ width: `${size}px`, height: `${size}px` }}
            role="img"
            aria-label={`${title}。${model.caption}。下方可按层级选择并读取数据。`}
          >
            {sectors.map((sector) => (
              <path
                key={sector.id}
                d={sector.path}
                className={`i-sunburst__sector ${sector.colorIndex < CHART_PALETTE_SIZE ? `is-c${sector.colorIndex}` : 'is-over'}${sector.kind === 'rest' ? ' is-rest' : ''}${sector.id === selectedId ? ' is-selected' : ''}`}
                onClick={() => onSelect?.(sector.id)}
                onDoubleClick={() => onFocus?.(sector.id)}
              >
                <title>{sector.description}</title>
              </path>
            ))}
            <text className="i-sunburst__center" x={size / 2} y={size / 2}>
              {centerText}
            </text>
          </svg>
          <p className="i-sunburst__caption">
            内圈是上级，外圈是它的下级；同一支各层同色。占比同时给出占全体与占上级两种分母。
          </p>
        </>
      )}
      <ol className="i-sunburst__data" aria-label="层级数据">
        {view.map((node) => (
          <li key={node.id} style={{ paddingInlineStart: `${node.depth * 16}px` }}>
            <button
              type="button"
              className="i-sunburst__row"
              aria-label={node.description}
              aria-pressed={selectedId === node.id}
              onClick={() => onSelect?.(node.id)}
            >
              <span>
                {node.label}
                {selectedId === node.id ? ' · 已选' : ''}
              </span>
              <span className="i-sunburst__values">
                {node.valueText} · 占全体 {node.shareText}
                {node.shareOfParent !== null && ` · 占上级 ${(node.shareOfParent * 100).toFixed(1)}%`} · 源行{' '}
                {node.sourceIndex + 1}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {model.excluded.length > 0 && (
        <ul className="i-sunburst__issues" aria-label="未计入的节点">
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
