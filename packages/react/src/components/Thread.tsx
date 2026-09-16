import { useEffect, useRef, useState } from 'react'
import {
  DELETED_BODY,
  editNote,
  keepDivider,
  readUpTo,
  threadItems,
  unreadState,
  type ThreadComment,
  type ThreadEntry,
  type ThreadNode,
  type UnreadState
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'
import { Avatar } from './Avatar'

export interface ThreadProps {
  entries: ThreadEntry[]
  /** 我是谁。自己说的话不算未读 */
  meId?: string
  lastReadAt?: number
  /** 把时间戳排成人话。时区是各端从系统拿的，因此留在调用方 */
  formatTime?: (ms: number) => string
  onReply?: (comment: ThreadComment) => void
  onRetry?: (comment: ThreadComment) => void
  onDiscard?: (comment: ThreadComment) => void
  onJump?: (id: string) => void
  onRead?: (lastReadAt: number) => void
  className?: string
}

const flatNodes = (node: ThreadNode): ThreadNode[] => [node, ...node.replies.flatMap(flatNodes)]

/**
 * 评论线程与活动记录（astra.md 的 B14）。
 *
 * 判断全在 logic/thread.ts，五端共用一份：删掉的父评论留坑、未读分隔线钉死不动、
 * 自己说的话不算未读、发失败的留在原地带着原文。
 */
export function Thread({
  entries,
  meId = '',
  lastReadAt = 0,
  formatTime = (ms: number) => new Date(ms).toLocaleString('zh-CN'),
  onReply,
  onRetry,
  onDiscard,
  onJump,
  onRead,
  className = ''
}: ThreadProps) {
  const items = threadItems(entries)
  /*
   * 未读分隔线在挂载的那一刻钉死：它跟着新评论往下跑的话，用户正读到一半，
   * 那条线就从他上方溜到了下方，他再也找不到读到哪儿了。
   */
  const [unread, setUnread] = useState<UnreadState>(() => unreadState(entries, lastReadAt, meId))
  const ref = useRef(unread)
  ref.current = unread
  useEffect(() => {
    setUnread(keepDivider(ref.current, entries, lastReadAt, meId))
  }, [entries, lastReadAt, meId])

  return (
    <section className={`i-thread ${className}`.trim()}>
      {unread.count > 0 && (
        <div className="i-thread__bar" role="status">
          <span className="i-thread__bar-text">{unread.text}</span>
          {unread.dividerId && (
            <Button size="sm" onClick={() => onJump?.(unread.dividerId!)}>
              跳到第一条
            </Button>
          )}
          <Button size="sm" onClick={() => onRead?.(readUpTo(entries, lastReadAt))}>
            全部标为已读
          </Button>
        </div>
      )}

      {items.map((item) => {
        if (item.kind === 'activity') {
          return (
            <div key={item.activities[0].id}>
              {unread.dividerId === item.activities[0].id && (
                <div className="i-thread__divider">{unread.text}</div>
              )}
              {/* 连续的活动记录折成一组：逐条铺开会把人说的话淹掉 */}
              <div className="i-thread__activity">
                <span className="i-thread__activity-icon">
                  <Icon name="history" size={12} />
                </span>
                <div>
                  <span>{item.summary}</span>
                  {item.activities.length > 1 && (
                    <ul className="i-thread__activity-list">
                      {item.activities.map((activity) => (
                        <li key={activity.id}>{activity.change}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )
        }

        return (
          <div key={item.node.comment.id}>
            {flatNodes(item.node).map((node) => {
              const comment = node.comment
              const note = editNote(comment, formatTime)
              return (
                <div key={comment.id} className={comment.parentId ? 'i-thread__replies' : undefined}>
                  {unread.dividerId === comment.id && (
                    <div className="i-thread__divider">{unread.text}</div>
                  )}

                  {/* 删掉但底下还有回复：留一个坑，否则那几句「同意」挂在空气里 */}
                  {node.tombstone ? (
                    <p className="i-thread__tombstone">{DELETED_BODY}</p>
                  ) : (
                    <article className={`i-comment${comment.parentId ? ' i-comment--reply' : ''}`}>
                      <div className="i-comment__avatar">
                        <Avatar name={comment.authorName} size={comment.parentId ? 'sm' : 'md'} />
                      </div>
                      <div className="i-comment__main">
                        <header className="i-comment__head">
                          <span className="i-comment__author">{comment.authorName}</span>
                          <span className="i-comment__time">{formatTime(comment.createdAt)}</span>
                          {/* 编辑过就看得见：一句话被改了意思，读者不该毫无察觉 */}
                          {note && <span className="i-thread__edited">{note}</span>}
                          {comment.sendState === 'sending' && (
                            <span className="i-thread__send">
                              <Icon name="clock" size={11} />
                              发送中
                            </span>
                          )}
                          {comment.sendState === 'failed' && (
                            <span className="i-thread__send i-thread__send--failed">
                              <Icon name="error-circle" size={11} />
                              发送失败：{comment.sendError || '网络没连上'}
                            </span>
                          )}
                        </header>

                        <div className="i-comment__content">{comment.body}</div>

                        {/* 失败那条的原文还在，动作摆在旁边：悄悄丢掉是最糟的 */}
                        {comment.sendState === 'failed' ? (
                          <div className="i-thread__failed-actions">
                            <Button size="sm" variant="primary" onClick={() => onRetry?.(comment)}>
                              重发
                            </Button>
                            <Button size="sm" onClick={() => onDiscard?.(comment)}>
                              放弃这条
                            </Button>
                          </div>
                        ) : (
                          !comment.sendState && (
                            <div className="i-comment__actions">
                              <Button size="sm" onClick={() => onReply?.(comment)}>
                                回复
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </article>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {!items.length && (
        <p className="i-thread__empty">还没有评论。第一条通常是把背景说清楚。</p>
      )}
    </section>
  )
}
