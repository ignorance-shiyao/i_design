/**
 * 会话列表：多轮会话的切换与管理。
 *
 * 攒到几十条之后，列表本身就成了一个要解决的问题：按时间分组而不是一条长列表、
 * 标题为空时用摘要顶上、删掉当前这条之后选它的后一条而不是弹回顶部。
 * 三条规则都在共享逻辑里——各端各写一遍的话，同样的操作在两端的结果不一样。
 */
import { useMemo, useState } from 'react'
import {
  filterSessions,
  groupSessions,
  moveActiveSession,
  nextAfterDelete,
  sessionTitle,
  type ChatSession
} from '@i-design/common'
import { Empty } from './Empty'
import { Icon } from './Icon'
import { Input } from './Input'

export interface ChatListProps {
  sessions: ChatSession[]
  active?: string
  /** 会话多了才需要搜索框；少几条时那个框只是占地方 */
  searchable?: boolean
  searchAfter?: number
  onActiveChange?: (id: string) => void
  onCreate?: () => void
  onRemove?: (id: string) => void
  onPin?: (id: string) => void
}

export function ChatList({
  sessions,
  active = '',
  searchable,
  searchAfter = 8,
  onActiveChange,
  onCreate,
  onRemove,
  onPin
}: ChatListProps) {
  const [query, setQuery] = useState('')
  const showSearch = searchable ?? sessions.length > searchAfter

  const shown = filterSessions(sessions, query)
  /* 分组的「现在」每次求值都取一次：跨过零点之后「今天」得变成「昨天」 */
  const groups = useMemo(() => groupSessions(shown, Date.now()), [shown])

  const onKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    onActiveChange?.(moveActiveSession(groups, active, event.key === 'ArrowDown' ? 1 : -1))
  }

  const remove = (session: ChatSession) => {
    // 先算好接下来选谁，再把删除抛出去：抛出去之后列表已经变了，算不准了。
    // 传的是分好组的列表——「后一条」说的是用户看到的下一条，不是数组里的下一个
    const next = nextAfterDelete(groups, session.id, active)
    onRemove?.(session.id)
    if (next !== active) onActiveChange?.(next)
  }

  return (
    <nav className="i-chatlist" aria-label="会话列表">
      <div className="i-chatlist__head">
        <button className="i-chatlist__new" type="button" onClick={() => onCreate?.()}>
          <Icon name="plus" size={14} />
          新会话
        </button>
      </div>

      {showSearch ? (
        <div className="i-chatlist__search">
          <Input
            value={query}
            onChange={setQuery}
            placeholder="搜索会话"
            aria-label="搜索会话"
          />
        </div>
      ) : null}

      {/* 列表本身可聚焦：上下键要在整份列表上生效，而不是逐个 Tab 过去 */}
      <div className="i-chatlist__body" tabIndex={0} onKeyDown={onKey}>
        {groups.map((group) => (
          <div key={group.key} className="i-chatlist__section">
            {/* 空组不渲染组标题：一条也没有的组标题只是在占地方 */}
            <h4 className="i-chatlist__group">{group.label}</h4>
            {group.sessions.map((session) => (
              <div
                key={session.id}
                className={`i-chatlist__item${session.id === active ? ' is-active' : ''}`}
              >
                {/*
                  切换会话的按钮就是标题本身，而不是整行套一个 role="button"：
                  套在外面的话，里面那两个操作按钮就成了嵌套的交互控件——
                  axe 的 nested-interactive 实测报过。
                */}
                <button
                  className="i-chatlist__pick"
                  type="button"
                  aria-current={session.id === active ? 'true' : undefined}
                  onClick={() => onActiveChange?.(session.id)}
                >
                  {session.pinned ? (
                    <Icon className="i-chatlist__pin" name="pin" size={12} />
                  ) : null}
                  <span className="i-chatlist__title">{sessionTitle(session)}</span>
                </button>
                <span className="i-chatlist__actions">
                  <button
                    className="i-chatlist__action"
                    type="button"
                    aria-label={`${session.pinned ? '取消置顶' : '置顶'}${sessionTitle(session)}`}
                    onClick={() => onPin?.(session.id)}
                  >
                    <Icon name="pin" size={12} />
                  </button>
                  <button
                    className="i-chatlist__action"
                    type="button"
                    aria-label={`删除 ${sessionTitle(session)}`}
                    onClick={() => remove(session)}
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ))}

        {/* 搜不到时说清楚是搜不到，而不是让列表空着——空着看起来像会话全没了 */}
        {groups.length === 0 ? (
          <Empty title={query ? `没有匹配「${query}」的会话` : '还没有会话'} description=" " />
        ) : null}
      </div>
    </nav>
  )
}
