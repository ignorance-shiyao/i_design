import { useMemo } from 'react'
import {
  artifactAdoptableIds,
  artifactPayload,
  artifactPreview,
  artifactContentDiff,
  openArtifact,
  toggleArtifactAdoption,
  type ArtifactRevision
} from '@i-design/common'
import { Button } from './Button'
import { Tag } from './Tag'
import { CodeBlock } from './CodeBlock'

export interface ArtifactWorkspaceProps {
  /** 同一产物可给出多个版本；组件只按 artifactId 打开其中一个序列。 */
  artifacts: ArtifactRevision[]
  artifactId: string
  version?: number
  adopted?: string[]
  title?: string
  onVersionChange?: (version: number) => void
  onAdoptedChange?: (ids: string[]) => void
  onDownload?: (artifact: ArtifactRevision) => void
}

/**
 * 智能体产物不是附件：版本选择、采纳和预览都走 common 的同一套判断。
 * 文档和代码只落到 <pre>，绝不把生成内容插进 DOM 执行。
 */
export function ArtifactWorkspace({
  artifacts,
  artifactId,
  version,
  adopted = [],
  title = '产物工作区',
  onVersionChange,
  onAdoptedChange,
  onDownload
}: ArtifactWorkspaceProps) {
  const workspace = useMemo(
    () => openArtifact(artifacts, artifactId, version, adopted),
    [artifacts, artifactId, version, adopted]
  )
  const preview = artifactPreview(workspace.current)
  const payload = artifactPayload(workspace.current)
  /*
   * 差异不止说「变了」，还要说清改了哪几行——一句「内容有变化」等于没说：
   * 用户要么逐字重读一遍，要么干脆不看，而产物工作区存在的理由恰恰是让人能复核。
   */
  const versionDiff = artifactContentDiff(artifacts, artifactId, workspace.current?.version)
  /* 逐行视图复用 CodeBlock：它已经有前后行号与 +/− 号（不靠颜色单独表意）。
     另写一套的话，同一段改动在代码块里与在产物里会显示成两个样子。 */
  const showLines = versionDiff.mode === 'lines' && versionDiff.added + versionDiff.removed > 0
  const ids = artifactAdoptableIds(workspace.current)
  const current = workspace.current

  return (
    <section className="i-artifact-workspace" aria-label={title}>
      <header className="i-artifact-workspace__head">
        <div>
          <h3>{current?.title ?? title}</h3>
          <span>{preview.label}</span>
        </div>
        {current && <Button size="sm" onClick={() => onDownload?.(current)}>导出</Button>}
      </header>
      {workspace.revisions.length > 1 && (
        <div className="i-artifact-workspace__versions" aria-label="产物版本">
          {workspace.revisions.map((item) => (
            <button
              key={item.version}
              type="button"
              className={item.version === current?.version ? 'is-active' : ''}
              onClick={() => onVersionChange?.(item.version)}
            >
              v{item.version}
            </button>
          ))}
        </div>
      )}
      {current && (
        <div className="i-artifact-workspace__preview">
          <Tag>{current.kind}</Tag>
          {preview.mode === 'text' ? (
            <pre>{current.content ?? '此版本未提供正文预览。'}</pre>
          ) : payload?.kind === 'table' ? (
            <table className="i-artifact-workspace__table">
              <thead><tr>{payload.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
              <tbody>{payload.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
            </table>
          ) : payload?.kind === 'chart' ? (
            <div className="i-artifact-workspace__chart" aria-label="图表预览">
              {payload.points.map((point) => <div className="i-artifact-workspace__bar" key={point.label}><span>{point.label}</span><i style={{ width: `${Math.max(0, Math.min(100, point.value))}%` }} /><b>{point.value}</b></div>)}
            </div>
          ) : (
            <p>{current.meta?.summary ?? '此版本可作为结构化结果查看或导出。'}</p>
          )}
        </div>
      )}
      {/* 任何情况下都有话可说：比不了也说清为什么，不会只剩一块空白 */}
      <p className="i-artifact-workspace__diff">{versionDiff.summary}</p>
      {showLines && (
        <div className="i-artifact-workspace__diff-lines">
          <CodeBlock
            code={versionDiff.current?.content ?? ''}
            before={versionDiff.previous?.content ?? ''}
            filename={`v${versionDiff.previous?.version} → v${versionDiff.current?.version}`}
            copyable={false}
            maxLines={14}
          />
        </div>
      )}
      {ids.length > 0 && (
        <footer className="i-artifact-workspace__foot">
          <span>{workspace.adopted.length ? `已采纳 ${workspace.adopted.length} 项` : '尚未采纳'}</span>
          {ids.map((id) => {
            const selected = workspace.adopted.includes(id)
            return (
              <Button
                key={id}
                size="sm"
                variant={selected ? 'secondary' : 'primary'}
                onClick={() => onAdoptedChange?.(toggleArtifactAdoption(current, workspace.adopted, id))}
              >
                {selected ? '撤销采纳' : '采纳'}
              </Button>
            )
          })}
        </footer>
      )}
    </section>
  )
}
