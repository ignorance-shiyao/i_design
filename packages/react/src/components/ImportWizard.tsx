import {
  assignMapping,
  canProceed,
  mappingIssues,
  problemsCsv,
  type ColumnMapping,
  type DryRunReport,
  type SourceColumn,
  type TargetField
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'
import { Select } from './Select'

export interface ImportWizardProps {
  /** 文件表头。由调用方解析出来 */
  sources?: SourceColumn[]
  /** 要导入到哪些字段 */
  fields?: TargetField[]
  /** 目标字段 → 来源列。受控：映射是数据，不是向导的内部状态 */
  mapping?: ColumnMapping
  /** 预检报告。跑过才有 */
  report?: DryRunReport
  busy?: boolean
  /** 问题清单最多列几条，再多折成一句 */
  maxProblems?: number
  onMappingChange?: (mapping: ColumnMapping) => void
  /** 跑预检。调用方保证它不写任何业务数据 */
  onDryRun?: () => void
  onSubmit?: () => void
  /** 把错误清单交出去，由调用方决定怎么落地（下载、复制、发邮件） */
  onDownload?: (csv: string) => void
  className?: string
}

/**
 * 导入向导的列映射与预检报告（astra.md 的 B11）。
 *
 * 文件怎么读、预检怎么跑、导入怎么发，都在调用方手里——这个组件不碰任何 IO。
 * 映射表按「一行一个目标字段」排：用户心里的问题是「我这张表里哪一列是客户」。
 */
export function ImportWizard({
  sources = [],
  fields = [],
  mapping = {},
  report,
  busy = false,
  maxProblems = 8,
  onMappingChange,
  onDryRun,
  onSubmit,
  onDownload,
  className = ''
}: ImportWizardProps) {
  const issues = mappingIssues(mapping, fields)
  const ready = canProceed(issues)
  const options = [
    { value: '', label: '（不映射）' },
    ...sources.map((s) => ({ value: s.key, label: s.key }))
  ]
  const sampleOf = (field: string) => sources.find((s) => s.key === mapping[field])?.sample ?? ''
  const visibleProblems = report?.problems.slice(0, maxProblems) ?? []
  const hiddenProblems = Math.max(0, (report?.problems.length ?? 0) - maxProblems)

  const pick = (field: string, value: unknown) => {
    // 多选的 Select 在这儿用不上：一个字段只能对着一列
    const one = Array.isArray(value) ? value[0] : value
    // 指给别人之前先从原处摘掉，否则会悄悄变成「一列映给两个字段」
    onMappingChange?.(assignMapping(mapping, field, one ? String(one) : null))
  }

  return (
    <section className={['i-import-wizard', className].filter(Boolean).join(' ')}>
      {/* 一行一个目标字段：用户心里的问题是「我这张表里哪一列是客户」 */}
      <ul className="i-import-wizard__map">
        {fields.map((field) => (
          <li key={field.key} className="i-import-wizard__row">
            <span className="i-import-wizard__field">
              {field.label}
              {/* 必填不只靠星号：后面跟着「必填」两个字 */}
              {field.required && <span className="i-import-wizard__required">必填</span>}
            </span>
            {/* React 端的 Select 不吃 className，套一层让它占满中间那一栏 */}
            <span className="i-import-wizard__pick">
              <Select
                value={mapping[field.key] ?? ''}
                options={options}
                ariaLabel={`${field.label} 对应的来源列`}
                onChange={(v) => pick(field.key, v)}
              />
            </span>
            {sampleOf(field.key) && (
              <span className="i-import-wizard__sample">样例：{sampleOf(field.key)}</span>
            )}
          </li>
        ))}
      </ul>

      {issues.length > 0 && (
        <ul className="i-import-wizard__issues">
          {issues.map((issue) => (
            <li
              key={`${issue.level}-${issue.field}`}
              className={`i-import-wizard__issue i-import-wizard__issue--${issue.level}`}
            >
              <span className="i-import-wizard__issue-icon">
                <Icon name={issue.level === 'error' ? 'error-circle' : 'warning-triangle'} size={12} />
              </span>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="i-import-wizard__actions">
        <Button size="sm" loading={busy} disabled={busy || !ready} onClick={onDryRun}>
          预检
        </Button>
        <Button
          size="sm"
          variant="primary"
          loading={busy}
          disabled={busy || !ready || !report}
          onClick={onSubmit}
        >
          开始导入
        </Button>
        {report && report.problems.length > 0 && (
          <Button size="sm" onClick={() => onDownload?.(problemsCsv(report.problems))}>
            下载错误清单
          </Button>
        )}
      </div>

      {report && (
        <>
          <div className="i-import-wizard__report" role="status">
            <span className="i-import-wizard__issue-icon">
              <Icon name={report.problems.length ? 'warning-triangle' : 'check-circle'} size={12} />
            </span>
            <span className="i-import-wizard__report-text">{report.summary}</span>
            {/* 这句话要一直在：它是用户敢点预检的理由 */}
            <p className="i-import-wizard__safe">
              预检没有写入任何数据，现在取消不会留下半份记录。
            </p>
          </div>

          {visibleProblems.length > 0 && (
            <ul className="i-import-wizard__problems">
              {visibleProblems.map((problem, i) => (
                <li key={`${problem.row}-${i}`}>
                  {/* 行号在最前面：用户手里那份是几千行的表格 */}
                  <span className="i-import-wizard__row-no">第 {problem.row} 行</span>
                  {problem.column ? ` · ${problem.column}` : ''} —— {problem.message}
                </li>
              ))}
              {hiddenProblems > 0 && <li>还有 {hiddenProblems} 条，下载错误清单看完整的</li>}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
