import { adjacencyShade, type AdjacencyModel } from '@i-design/common'

export interface ChartAdjacencyProps {
  /** buildAdjacency 生成的同源模型，可直接序列化给其他端 */
  model: AdjacencyModel
  title?: string
  selectedRow?: number | null
  selectedCol?: number | null
  onSelect?: (row: number, col: number) => void
  className?: string
}

export function ChartAdjacency({
  model,
  title = '邻接矩阵',
  selectedRow = null,
  selectedCol = null,
  onSelect,
  className = ''
}: ChartAdjacencyProps) {
  const cellClass = (row: number, col: number) => {
    const cell = model.cells[row]?.[col]
    if (!cell) return 'is-absent'
    if (cell.state === 'absent') return 'is-absent'
    if (cell.state === 'unknown') return 'is-unknown'
    const step = adjacencyShade(cell, model.min, model.max)
    return step === null ? 'is-absent' : `is-s${step}`
  }

  const stateLabel = (state: string, value: number | null) => {
    if (state === 'absent') return '无边'
    if (state === 'unknown') return '未观测'
    if (value === 0) return '零权'
    return ''
  }

  const zeroCount = model.cells.flat().filter((cell) => cell.state === 'ready' && cell.value === 0).length
  const sortLabel = model.sort === 'input' ? '输入序' : model.sort === 'degree' ? '度数' : '社群'

  return (
    <figure className={`i-adjacency ${className}`.trim()}>
      <figcaption className="i-adjacency__title">{title}</figcaption>
      <p className="i-adjacency__caption">{model.caption}</p>
      <p className="i-adjacency__basis">口径：{model.basis}</p>

      <div className="i-adjacency__status" aria-label="矩阵状态">
        <span className="i-adjacency__chip">{model.directed ? '有向' : '无向'}</span>
        <span className="i-adjacency__chip">排序 · {sortLabel}</span>
        {model.counts.absent > 0 && (
          <span className="i-adjacency__chip is-absent">{model.counts.absent} 个无边空档</span>
        )}
        {model.counts.unknown > 0 && (
          <span className="i-adjacency__chip is-unknown">{model.counts.unknown} 个未观测</span>
        )}
        {zeroCount > 0 && <span className="i-adjacency__chip is-zero">{zeroCount} 条零权边</span>}
      </div>

      {model.state === 'ready' && (
        <>
          <div className="i-adjacency__scroll">
            <table className="i-adjacency__table">
              <caption className="i-adjacency__sr">
                {title}：{model.caption}。{model.basis}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="i-adjacency__corner">
                    从 \ 到
                  </th>
                  {model.nodes.map((node) => (
                    <th key={`h-${node.id}`} scope="col">
                      {node.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.cells.map((row, rowIndex) => (
                  <tr key={model.nodes[rowIndex].id}>
                    <th scope="row" className="i-adjacency__row-head">
                      {model.nodes[rowIndex].label}
                      <span className="i-adjacency__state">度 {model.nodes[rowIndex].degree}</span>
                    </th>
                    {row.map((cell, colIndex) => {
                      const selected = selectedRow === rowIndex && selectedCol === colIndex
                      const label = stateLabel(cell.state, cell.value)
                      return (
                        <td key={`${cell.rowId}-${cell.columnId}`}>
                          <button
                            type="button"
                            className={`i-adjacency__cell ${cellClass(rowIndex, colIndex)}${selected ? ' is-selected' : ''}`}
                            aria-pressed={selected}
                            aria-label={cell.description}
                            onClick={() => onSelect?.(rowIndex, colIndex)}
                          >
                            <span>{cell.valueText}</span>
                            {label ? <span className="i-adjacency__state">{label}</span> : null}
                            <span className="i-adjacency__sr">{cell.description}</span>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="i-adjacency__note">
            「—」且标「无边」是确认没有边；「—」且标「未观测」是没统计到；「0」是权重为零的边。三者不是一回事。
          </p>
        </>
      )}

      {model.excluded.length > 0 && (
        <ul className="i-adjacency__issues" aria-label="未计入的节点或边">
          {model.excluded.map((row) => (
            <li key={`${row.id}-${row.sourceIndex}`}>
              未计入 · {row.id}：{row.reason}
            </li>
          ))}
        </ul>
      )}
    </figure>
  )
}
