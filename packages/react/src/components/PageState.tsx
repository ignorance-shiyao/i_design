import type { ReactNode } from 'react'
import { pageState, PAGE_STATE_ACTIONS, type IconName } from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'
import { Empty } from './Empty'
import { Skeleton } from './Skeleton'

export interface PageStateProps {
  loading?: boolean
  online?: boolean
  /** 请求错误；403 会被识别成「无权限」而不是普通失败 */
  error?: { code?: number | string; message?: string } | null
  /** 已经拿到的数据条数。部分成功要靠它与 failed 一起判定 */
  loaded?: number
  failed?: number
  fetchedAt?: number
  staleAfter?: number
  emptyType?: 'empty' | 'search' | 'error' | 'permission'
  title?: string
  emptyAction?: ReactNode
  onAction?: (kind: string) => void
  children?: ReactNode
}

/*
 * 状态用「图标 + 淡底色块 + 文字标签」表达，不用加粗边线，也不靠颜色单独表意。
 * 三张表与 Vue 端逐项一致——判定本身在 @i-design/common 里，只有一份。
 */
const ICONS: Record<string, IconName> = {
  offline: 'offline',
  forbidden: 'lock',
  failed: 'error-circle',
  partial: 'warning-triangle',
  stale: 'history'
}
const TONE: Record<string, string> = {
  offline: 'muted', forbidden: 'warning', failed: 'danger', partial: 'warning', stale: 'muted'
}
const LABELS: Record<string, string> = {
  offline: '离线', forbidden: '无权限', failed: '加载失败', partial: '部分成功', stale: '数据已过期'
}

export function PageState({
  loading = false,
  online = true,
  error = null,
  loaded = 0,
  failed = 0,
  fetchedAt,
  staleAfter,
  emptyType = 'empty',
  title = '',
  emptyAction,
  onAction,
  children
}: PageStateProps) {
  const state = pageState({ loading, online, error, loaded, failed, fetchedAt, staleAfter })

  return (
    <div className="i-page-state">
      {/* 骨架屏只在一条数据都没有时占位；已有数据时刷新不该先变成一片白 */}
      {state.kind === 'loading' && !state.keepsContent && <Skeleton rows={4} />}

      {state.kind === 'empty' && (
        <Empty type={emptyType} title={title}>
          {emptyAction}
        </Empty>
      )}

      {state.kind !== 'ready' && state.kind !== 'loading' && state.kind !== 'empty' && (
        <div className={`i-page-state__note is-${TONE[state.kind]}`} role="status">
          <span className="i-page-state__icon">
            <Icon name={ICONS[state.kind]} size={18} />
          </span>
          <div className="i-page-state__body">
            <p className="i-page-state__title">{title || LABELS[state.kind]}</p>
            <p className="i-page-state__reason">{state.reason}</p>
          </div>
          {state.action && (
            <Button variant="secondary" size="sm" onClick={() => onAction?.(state.action!)}>
              {PAGE_STATE_ACTIONS[state.action]}
            </Button>
          )}
        </div>
      )}

      {state.keepsContent && (
        <div className="i-page-state__content" aria-busy={state.kind === 'loading'}>
          {children}
        </div>
      )}
    </div>
  )
}
