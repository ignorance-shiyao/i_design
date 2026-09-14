import { useState, type ReactNode } from 'react'
import {
  chartSummary, dataIssues, issueText, toCsv, toTable,
  type ChartDataset, type ChartSpec
} from '@i-design/common'
import { Button } from './Button'
import { Icon } from './Icon'
import { PageState } from './PageState'

export interface ChartFrameProps {
  title?: string
  subtitle?: string
  /** 统计口径。同一张图换个口径就是另一回事，而读者无从分辨，除非写出来 */
  note?: string
  dataset?: ChartDataset | null
  spec?: ChartSpec | null
  loading?: boolean
  error?: { code?: number | string; message?: string } | null
  /** 下载的文件名，不含扩展名 */
  fileName?: string
  actions?: ReactNode
  onRetry?: () => void
  children?: ReactNode
}

/*
 * 「出口」是这个组件存在的主要理由：每张图都要有一条不看图也能拿到数的路。
 * 表格与图同源——都从 toSeries 出来，各算一遍的实现迟早会在某次改口径时
 * 只改一边，而对不上的两个数字比没有表格更糟。
 */
export function ChartFrame({
  title = '',
  subtitle = '',
  note = '',
  dataset = null,
  spec = null,
  loading = false,
  error = null,
  fileName = 'chart',
  actions,
  onRetry,
  children
}: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false)
  const table = dataset && spec ? toTable(dataset, spec) : { header: [], rows: [] }
  const issues = dataset && spec ? dataIssues(dataset, spec) : []
  const summary = dataset && spec ? chartSummary(dataset, spec) : ''

  const download = () => {
    // BOM：不加的话 Excel 打开中文列名是乱码，而这是最常见的去处
    const blob = new Blob([`﻿${toCsv(table)}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${fileName}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <figure className="i-chart-frame">
      <figcaption className="i-chart-frame__head">
        <div className="i-chart-frame__titles">
          {title ? <h3 className="i-chart-frame__title">{title}</h3> : null}
          {subtitle ? <p className="i-chart-frame__subtitle">{subtitle}</p> : null}
        </div>
        <div className="i-chart-frame__actions">
          {actions}
          <Button variant="text" size="sm" aria-expanded={showTable} onClick={() => setShowTable(!showTable)}>
            <Icon name="grid" size={14} />
            {showTable ? '看图' : '看数据'}
          </Button>
          <Button variant="text" size="sm" disabled={!table.rows.length} onClick={download}>
            <Icon name="download" size={14} />
            下载 CSV
          </Button>
        </div>
      </figcaption>

      <PageState loading={loading} error={error} loaded={table.rows.length} onAction={onRetry}>
        {/*
          图本身由调用方给：这个组件不认识任何一种图。

          摘要写成一段对读屏可见、视觉上隐藏的文字，而不是给容器挂 role="img"：
          role="img" 会把整棵子树当成一张图，里面的图例按钮就成了嵌套交互，
          读屏用户也就点不到图例了。
        */}
        <div className="i-chart-frame__canvas" hidden={showTable}>
          <p className="i-chart-frame__summary">{summary}</p>
          {children}
        </div>

        {/* 表格出口：与图同源，缺失值显示「—」而不是 0 */}
        <div className="i-chart-frame__table-wrap" hidden={!showTable}>
          <table className="i-chart-frame__table">
            <caption className="i-chart-frame__caption">{title || '数据表'}</caption>
            <thead>
              <tr>{table.header.map((head) => <th key={head} scope="col">{head}</th>)}</tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, column) =>
                    column === 0 ? (
                      <th key={column} scope="row">{cell}</th>
                    ) : (
                      <td key={column} className={cell === null ? 'is-missing' : undefined}>
                        {cell === null ? '—' : cell}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageState>

      {note ? <p className="i-chart-frame__note">{`口径：${note}`}</p> : null}

      {/* 数据本身的问题单独说，不混进口径 */}
      {issues.length ? (
        <ul className="i-chart-frame__issues">
          {issues.map((issue, index) => (
            <li key={index}>
              <Icon name="info-circle" size={12} />
              {issueText(issue)}
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  )
}
