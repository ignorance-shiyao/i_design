import { useEffect, useMemo, useState } from 'react'
import {
  defaultDiffSelection,
  diffActionLabel,
  summarizeDiff,
  toggleDiffRow,
  type DiffRow
} from '@i-design/common'
import { Button } from './Button'
import { Checkbox } from './Checkbox'

export interface DiffTableProps {
  title?: string
  /** 列的 key 与表头文案 */
  columns: { key: string; label: string }[]
  rows: DiffRow[]
  onApply?: (ids: string[]) => void
}

const SIGN: Record<string, string> = { added: '＋', removed: '−', changed: '~', unchanged: '' }

export function DiffTable({
  title = '待应用的改动',
  columns,
  rows,
  onApply
}: DiffTableProps) {
  // 默认全选：智能体给的是一整套方案，逐个勾选反而是例外
  const [selected, setSelected] = useState<string[]>(() => defaultDiffSelection(rows))
  useEffect(() => setSelected(defaultDiffSelection(rows)), [rows])

  const summary = useMemo(() => summarizeDiff(rows, selected), [rows, selected])
  const toggle = (id: string) => setSelected(toggleDiffRow(rows, selected, id))

  return (
    <section className="i-difftable">
      <header className="i-difftable__head">
        <span className="i-difftable__title">{title}</span>
        <span className="i-difftable__hint">点击改动行可以取消采纳</span>
      </header>

      <table className="i-difftable__grid">
        <thead>
          <tr>
            <th style={{ width: 40 }} aria-label="采纳" />
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={[
                'i-difftable__row',
                `is-${row.kind}`,
                row.kind !== 'unchanged' && !selected.includes(row.id) ? 'is-off' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => toggle(row.id)}
            >
              <td>
                {row.kind !== 'unchanged' && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.includes(row.id)} onChange={() => toggle(row.id)} />
                  </span>
                )}
              </td>
              {columns.map((column, index) => (
                <td key={column.key}>
                  {/*
                    改动类型用前缀符号 + 淡底双重表达：只用红绿底色的话，
                    色觉障碍用户看到的是两块一样的灰。符号只出现在首列，避免每格都重复。
                  */}
                  {index === 0 && (
                    <span className="i-difftable__sign" aria-hidden="true">
                      {SIGN[row.kind]}
                    </span>
                  )}
                  {row.cells[column.key]?.before && (
                    <span className="i-difftable__before">{row.cells[column.key].before}</span>
                  )}
                  {row.cells[column.key]?.value ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="i-difftable__foot">
        <span className="i-difftable__stat">
          {summary.removed} 处删除 · {summary.added} 处新增 · {summary.changed} 处修改
        </span>
        <Button
          variant="primary"
          size="sm"
          disabled={summary.selected === 0}
          onClick={() => onApply?.(selected)}
        >
          {diffActionLabel(summary)}
        </Button>
      </footer>
    </section>
  )
}
