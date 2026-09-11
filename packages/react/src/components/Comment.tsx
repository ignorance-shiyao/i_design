import type { ReactNode } from 'react'
import { Avatar } from './Avatar'

export interface CommentProps {
  author?: string
  /** 已经格式化好的时间文案。相对时间的算法在 logic/date，由调用方决定用哪种 */
  datetime?: string
  content?: ReactNode
  /** 被回复的原文 */
  quote?: ReactNode
  avatar?: string
  /** 作为回复出现时收紧上下留白 */
  reply?: boolean
  actions?: ReactNode
  replies?: ReactNode
  children?: ReactNode
}

export function Comment({
  author = '',
  datetime = '',
  content,
  quote,
  avatar = '',
  reply = false,
  actions,
  replies,
  children
}: CommentProps) {
  return (
    <article className={`i-comment${reply ? ' i-comment--reply' : ''}`}>
      <div className="i-comment__avatar">
        <Avatar src={avatar} name={author} size={reply ? 'sm' : 'md'} />
      </div>

      <div className="i-comment__main">
        <header className="i-comment__head">
          <span className="i-comment__author">{author}</span>
          {datetime && <span className="i-comment__time">{datetime}</span>}
        </header>

        {quote && <div className="i-comment__quote">{quote}</div>}

        <div className="i-comment__content">{children ?? content}</div>

        {actions && <div className="i-comment__actions">{actions}</div>}
        {replies && <div className="i-comment__replies">{replies}</div>}
      </div>
    </article>
  )
}
