import { useEffect, useState, type ReactNode } from 'react'
import {
  bulkSelection,
  canEscalate,
  escalateLabel,
  type BulkId,
  type BulkOutcome,
  type BulkScope
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'

type Selection = ReturnType<typeof bulkSelection>

export interface BulkBarProps {
  /** 当前作用域。受控：这是整条的核心状态，不能由组件自己猜 */
  scope?: BulkScope
  /** 当前页的行 id */
  pageIds?: BulkId[]
  /** 用户勾中的行 id */
  selectedIds?: BulkId[]
  /** 符合当前筛选的总条数，由服务端给 */
  matchedTotal?: number
  /** 当前有没有筛选条件。没有筛选时「全部匹配」就是「全表」 */
  filtered?: boolean
  /** 上一轮的执行结果。给了就把成功与失败摊在条下面 */
  outcome?: BulkOutcome
  busy?: boolean
  /** 失败清单最多列几条，再多就折成一句 */
  maxFailures?: number
  /** Vue 端是具名插槽，React 没有插槽，用渲染函数给出这一条上的操作按钮 */
  renderActions?: (selection: Selection, run: () => void) => ReactNode
  onScopeChange?: (scope: BulkScope) => void
  /**
   * 执行。ids 为 null 表示「全部匹配」——调用方要把筛选条件发给服务端，
   * 而不是自己凑一份名单。
   */
  onExecute?: (selection: Selection) => void
  /** 只重试失败的那些 */
  onRetry?: (ids: BulkId[]) => void
  onClear?: () => void
  className?: string
}

/**
 * 列表页上方的批量操作条（astra.md 的 B07）。
 *
 * 第一职责是把「对谁做」说清楚，摘要永远在按钮左边；第二职责是把部分失败摊开，
 * 因为失败的那几条还要照着去处理，重试也只能发这几条。
 * 判断全在 logic/bulk.ts，五端共用一份。
 */
export function BulkBar({
  scope = 'selected',
  pageIds = [],
  selectedIds = [],
  matchedTotal = 0,
  filtered = false,
  outcome,
  busy = false,
  maxFailures = 5,
  renderActions,
  onScopeChange,
  onExecute,
  onRetry,
  onClear,
  className = ''
}: BulkBarProps) {
  const selection = bulkSelection({ scope, pageIds, selectedIds, matchedTotal, filtered })
  const escalatable =
    scope !== 'matched' && canEscalate({ pageIds, selectedIds, matchedTotal })

  const [asking, setAsking] = useState(false)
  // 范围一变，之前那次确认就不作数了——它复述的条数已经不对
  useEffect(() => setAsking(false), [scope, matchedTotal, selectedIds.length])

  const run = () => {
    if (selection.needsConfirm && !asking) {
      setAsking(true)
      return
    }
    setAsking(false)
    onExecute?.(selection)
  }

  if (selection.count === 0 && !outcome) return null

  const visibleFailures = outcome?.failed.slice(0, maxFailures) ?? []
  const hiddenFailures = Math.max(0, (outcome?.failed.length ?? 0) - maxFailures)

  return (
    <div
      className={['i-bulk-bar', scope === 'matched' ? 'i-bulk-bar--matched' : '', className]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label="批量操作"
    >
      {scope === 'matched' && (
        <span className="i-bulk-bar__badge">
          <Icon name="warning-triangle" size={14} />
        </span>
      )}

      {/* 摘要在最左边，在按钮之前：范围写在按钮右边等于让人先点后读 */}
      <p className="i-bulk-bar__summary">
        <span className="i-bulk-bar__count">{selection.summary}</span>
      </p>

      <div className="i-bulk-bar__scope">
        {/* 只在「当前页已全勾上、匹配总数更多」时给这个入口 */}
        {escalatable && (
          <Button size="sm" variant="text" onClick={() => onScopeChange?.('matched')}>
            {escalateLabel(matchedTotal, filtered)}
          </Button>
        )}
        {scope === 'matched' && (
          <Button size="sm" variant="text" onClick={() => onScopeChange?.('selected')}>
            仅保留已勾选的 {selectedIds.length} 项
          </Button>
        )}
        {selection.count > 0 && (
          <Button size="sm" variant="text" onClick={onClear}>
            取消选择
          </Button>
        )}
      </div>

      <div className="i-bulk-bar__actions">
        {renderActions ? (
          renderActions(selection, run)
        ) : (
          <Button
            size="sm"
            variant="primary"
            loading={busy}
            disabled={busy || selection.count === 0}
            onClick={run}
          >
            执行
          </Button>
        )}
      </div>

      {/* 确认就地展开在条下面：用户点的是这条上的按钮，答案就该出现在这条上 */}
      {asking && (
        <div
          className="i-bulk-bar__panel i-bulk-bar__panel--danger"
          role="alertdialog"
          aria-label={selection.confirmMessage}
        >
          <span className="i-bulk-bar__panel-icon">
            <Icon name="warning-triangle" size={14} />
          </span>
          <span className="i-bulk-bar__panel-text">{selection.confirmMessage}</span>
          <Button size="sm" onClick={() => setAsking(false)}>
            再看看
          </Button>
          <Button size="sm" variant="danger" onClick={run}>
            确认执行
          </Button>
        </div>
      )}

      {outcome && (
        <>
          <div
            className={`i-bulk-bar__panel i-bulk-bar__panel--${
              outcome.kind === 'all-ok' ? 'success' : 'danger'
            }`}
            role="status"
          >
            <span className="i-bulk-bar__panel-icon">
              <Icon name={outcome.kind === 'all-ok' ? 'check-circle' : 'error-circle'} size={14} />
            </span>
            <span className="i-bulk-bar__panel-text">{outcome.summary}</span>
            {/* 重试只发失败项：成功项再执行一次，扣款与发货这类动作就是事故 */}
            {outcome.retryIds.length > 0 && (
              <Button size="sm" loading={busy} onClick={() => onRetry?.(outcome.retryIds)}>
                只重试失败的 {outcome.retryIds.length} 项
              </Button>
            )}
          </div>

          {visibleFailures.length > 0 && (
            <ul className="i-bulk-bar__failures">
              {visibleFailures.map((item) => (
                <li key={String(item.id)}>
                  <span className="i-bulk-bar__failure-id">{item.id}</span> —— {item.reason}
                </li>
              ))}
              {hiddenFailures > 0 && <li>还有 {hiddenFailures} 项失败，展开列表查看</li>}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
