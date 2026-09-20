import { CHART_PALETTE_SIZE, hierarchyView, icicleCells, type HierarchyModel } from '@i-design/common'

export interface ChartIcicleProps {
  /** buildHierarchy 生成的同源模型，可直接序列化给其他端 */
  model: HierarchyModel
  title?: string
  /** 下钻焦点；为空表示看整棵树 */
  focusId?: string
  selectedId?: string
  rowHeight?: number
  onSelect?: (id: string) => void
  onFocus?: (id: string) => void
  className?: string
}

/*
 * 用 HTML 盒子而不是 SVG：viewBox 是整体缩放，窄屏上行高与字会跟着宽度一起缩，
 * 320px 下整张图只剩三十来像素高。排版用百分比那一组，像素那一组按这个标称宽度算，
 * 「写不写得下名字」就是按它估的。
 */
const WIDTH = 640

const colorClass = (colorIndex: number, kind: string) =>
  kind === 'rest' ? 'is-rest' : colorIndex < CHART_PALETTE_SIZE ? `is-c${colorIndex}` : 'is-over'

export function ChartIcicle({
  model,
  title = 'Icicle 图',
  focusId = '',
  selectedId = '',
  rowHeight = 28,
  onSelect,
  onFocus,
  className = ''
}: ChartIcicleProps) {
  const view = hierarchyView(model, focusId || null)
  const cells = icicleCells(view, { width: WIDTH, rowHeight })
  const rows = Math.max(0, ...cells.map((cell) => cell.depth + 1))
  const focused = model.nodes.find((node) => node.id === focusId)

  return (
    <figure className={`i-icicle ${className}`.trim()}>
      <figcaption className="i-icicle__title">{title}</figcaption>
      <p className="i-icicle__caption">{model.caption}</p>
      {model.state === 'ready' && (
        <>
          {focusId && (
            <p className="i-icicle__crumb">
              <button type="button" className="i-icicle__up" onClick={() => onFocus?.('')}>
                返回全部
              </button>
              <span>
                当前只看：{focused?.label}（{focused?.valueText}）
              </span>
            </p>
          )}
          <div
            className="i-icicle__plot"
            style={{ height: `${rows * rowHeight}px` }}
            role="img"
            aria-label={`${title}。${model.caption}。下方可按层级选择并读取数据。`}
          >
            {cells.map((cell) => (
              <div
                key={cell.id}
                className={`i-icicle__cell ${colorClass(cell.colorIndex, cell.kind)}${cell.id === selectedId ? ' is-selected' : ''}`}
                style={{
                  insetInlineStart: `${cell.xPercent}%`,
                  width: `${cell.widthPercent}%`,
                  top: `${cell.y}px`,
                  height: `${cell.height}px`
                }}
                title={cell.description}
                onClick={() => onSelect?.(cell.id)}
                onDoubleClick={() => onFocus?.(cell.id)}
              >
                {cell.labelFits && <span className="i-icicle__label">{cell.label}</span>}
              </div>
            ))}
          </div>
          <p className="i-icicle__caption">
            每一行是一层，上一行是下一行的上级；宽度按占全体的比例分配，同一支各层同色。
          </p>
        </>
      )}
      <ol className="i-icicle__data" aria-label="层级数据">
        {view.map((node) => (
          <li key={node.id} style={{ paddingInlineStart: `${node.depth * 16}px` }}>
            <button
              type="button"
              className="i-icicle__row"
              aria-label={node.description}
              aria-pressed={selectedId === node.id}
              onClick={() => onSelect?.(node.id)}
            >
              <span>
                {node.label}
                {selectedId === node.id ? ' · 已选' : ''}
              </span>
              <span className="i-icicle__values">
                {node.valueText} · 占全体 {node.shareText}
                {node.shareOfParent !== null && ` · 占上级 ${(node.shareOfParent * 100).toFixed(1)}%`} · 源行{' '}
                {node.sourceIndex + 1}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {model.excluded.length > 0 && (
        <ul className="i-icicle__issues" aria-label="未计入的节点">
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
