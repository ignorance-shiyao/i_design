import type { ReactNode } from 'react'
import {
  detailActions,
  detailNeighbours,
  noActionHint,
  recordFreshness,
  returnLabel,
  unpackReturn,
  type DetailActionSpec,
  type ReturnTicket
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'
import { Tag } from './Tag'

export interface DetailPageProps {
  title: string
  /** 状态的显示名。同时也是「没有可执行操作」那句话里的那个词 */
  status: string
  statusTone?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
  summary?: string
  /** 这一页有哪些动作。状态不允许的不会出现，没权限的出现但停用 */
  actions?: DetailActionSpec[]
  permissions?: string[]
  /** 进页面时拿到的版本号 */
  seenRevision?: number
  /** 此刻服务端上的版本号 */
  currentRevision?: number
  exists?: boolean
  /** 业务规则挡下的动作：键是动作 key，值是给人看的原因 */
  denied?: Record<string, string>
  /** 列表里这一批的 id，用来算上一条 / 下一条 */
  siblingIds?: string[]
  currentId?: string
  /** 从列表带过来的返回票据（packReturn 的产物） */
  returnTicket?: string
  /** Vue 端是具名插槽 extra，React 没有插槽 */
  extra?: ReactNode
  children?: ReactNode
  /** 点了某个动作。停用的动作不会触发 */
  onAction?: (key: string) => void
  onRefresh?: () => void
  /** 回列表。带上解出来的票据，调用方照它还原筛选与滚动位置 */
  onBack?: (ticket: ReturnTicket | null) => void
  onNavigate?: (id: string) => void
  className?: string
}

/**
 * 一条记录摊开之后的页面骨架（astra.md 的 B12）。
 *
 * 版面顺序是刻意的：返回入口与「第几条」在最上面，然后标题与状态，
 * 再是失效提示，最后才是动作——把动作放在失效提示上面的话，
 * 用户会先点、再读到「这份已经旧了」。判断全在 logic/detail.ts。
 */
export function DetailPage({
  title,
  status,
  statusTone = 'default',
  summary = '',
  actions = [],
  permissions = [],
  seenRevision = 0,
  currentRevision = 0,
  exists = true,
  denied = {},
  siblingIds = [],
  currentId = '',
  returnTicket = '',
  extra,
  children,
  onAction,
  onRefresh,
  onBack,
  onNavigate,
  className = ''
}: DetailPageProps) {
  const freshness = recordFreshness({ seenRevision, currentRevision, exists })
  const resolved = detailActions(actions, {
    status,
    permissions,
    freshness: freshness.kind,
    denied
  })

  /*
   * 灰按钮的理由按原因归并：同一个原因挡住三个动作时不说三遍。
   * 写在按钮下面而不是只挂 title——触摸屏没有悬停，读屏也不会主动去念 title。
   */
  const grouped = new Map<string, string[]>()
  for (const action of resolved) {
    if (!action.disabled) continue
    grouped.set(action.reason, [...(grouped.get(action.reason) ?? []), action.label])
  }
  const reasons = [...grouped].map(([reason, labels]) => ({ reason, labels: labels.join('、') }))

  const neighbours = detailNeighbours(siblingIds, currentId)
  const ticket = unpackReturn(returnTicket)

  return (
    <article className={['i-detail-page', className].filter(Boolean).join(' ')}>
      <nav className="i-detail-page__nav" aria-label="记录导航">
        <Button size="sm" variant="text" onClick={() => onBack?.(ticket)}>
          <Icon name="arrow-left" size={14} />
          {returnLabel(ticket)}
        </Button>

        {neighbours.position && <p className="i-detail-page__position">{neighbours.position}</p>}

        <div className="i-detail-page__steps">
          {/* 到头了按钮停用而不是消失：消失会让人以为是页面坏了 */}
          <Button
            size="sm"
            disabled={!neighbours.prevId}
            aria-label={neighbours.prevId ? '上一条' : neighbours.edgeHint}
            onClick={() => neighbours.prevId && onNavigate?.(neighbours.prevId)}
          >
            上一条
          </Button>
          <Button
            size="sm"
            disabled={!neighbours.nextId}
            aria-label={neighbours.nextId ? '下一条' : neighbours.edgeHint}
            onClick={() => neighbours.nextId && onNavigate?.(neighbours.nextId)}
          >
            下一条
          </Button>
        </div>
      </nav>

      <header className="i-detail-page__head">
        <h1 className="i-detail-page__title">{title}</h1>
        <Tag type={statusTone}>{status}</Tag>
        {extra}
        {summary && <p className="i-detail-page__summary">{summary}</p>}
      </header>

      {/* 失效提示在动作上面：放下面的话，用户会先点、再读到「这份已经旧了」 */}
      {freshness.kind !== 'fresh' && (
        <div
          className={`i-detail-page__stale${
            freshness.kind === 'deleted' ? ' i-detail-page__stale--deleted' : ''
          }`}
          role="status"
        >
          <span className="i-detail-page__stale-icon">
            <Icon name={freshness.kind === 'deleted' ? 'error-circle' : 'history'} size={14} />
          </span>
          <span className="i-detail-page__stale-label">{freshness.label}</span>
          <span className="i-detail-page__stale-text">{freshness.detail}</span>
          {freshness.action === 'refresh' && (
            <Button size="sm" onClick={onRefresh}>
              刷新看最新
            </Button>
          )}
          {freshness.action === 'back' && (
            <Button size="sm" onClick={() => onBack?.(ticket)}>
              回到列表
            </Button>
          )}
        </div>
      )}

      {resolved.length > 0 ? (
        <div className="i-detail-page__actions">
          {resolved.map((action) => (
            <Button
              key={action.key}
              size="sm"
              variant={
                action.kind === 'primary' ? 'primary' : action.kind === 'danger' ? 'danger' : 'secondary'
              }
              disabled={action.disabled}
              title={action.reason || undefined}
              onClick={() => onAction?.(action.key)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : (
        // 空白一片会让人以为页面没加载完
        <p className="i-detail-page__empty">{noActionHint(status)}</p>
      )}

      {reasons.length > 0 && (
        <ul className="i-detail-page__reasons">
          {reasons.map((item) => (
            <li key={item.reason}>
              <span className="i-detail-page__reason-keys">{item.labels}</span>
              不可用：{item.reason}
            </li>
          ))}
        </ul>
      )}

      <div className="i-detail-page__body">{children}</div>
    </article>
  )
}
