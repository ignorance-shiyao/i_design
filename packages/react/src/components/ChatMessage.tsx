import type { ReactNode } from 'react'
import { useConfig } from './ConfigProvider'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

export interface ChatMessageProps {
  role?: 'user' | 'assistant'
  /** 显示在头像旁的名字；助手侧通常是模型名 */
  name?: string
  time?: string
  avatar?: string
  /** 流式输出中：文字末尾显示光标，同时抑制操作区 */
  streaming?: boolean
  /** 这一轮失败了：整段转为危险色，并给出重试入口 */
  error?: boolean
  /** 正文之前：推理过程、工具调用等 */
  before?: ReactNode
  /** 正文之后：来源、追问建议 */
  after?: ReactNode
  onCopy?: () => void
  onRetry?: () => void
  className?: string
  children?: ReactNode
}

/**
 * 两个角色的排版刻意不对称：用户消息是右对齐、宽度受限的气泡，
 * 助手消息是左对齐的通栏正文——二者的阅读量差着数量级。
 */
export function ChatMessage({
  role = 'assistant',
  name = '',
  time = '',
  avatar,
  streaming = false,
  error = false,
  before,
  after,
  onCopy,
  onRetry,
  className = '',
  children
}: ChatMessageProps) {
  /* 「重试」与「重新生成」是两件事：一个是失败后重来，一个是对结果不满意再来一次 */
  const { locale } = useConfig()
  return (
    <article
      className={['i-chat-msg', `i-chat-msg--${role}`, error ? 'is-error' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <Avatar
        className="i-chat-msg__avatar"
        name={name || (role === 'user' ? '我' : 'AI')}
        src={avatar}
        size={32}
        shape={role === 'assistant' ? 'square' : 'circle'}
      />

      <div className="i-chat-msg__body">
        {(name || time) && (
          <div className="i-chat-msg__meta">
            {name && <span className="i-chat-msg__name">{name}</span>}
            {time && <span>{time}</span>}
          </div>
        )}

        {before}

        <div className="i-chat-msg__content">
          {children}
          {streaming && <span className="i-chat-msg__caret" aria-hidden="true" />}
        </div>

        {after}

        {/* 生成过程中不给操作按钮：此时复制到的是半截内容，重试也没有意义 */}
        {!streaming && (
          <div className="i-chat-msg__actions">
            <button className="i-chat-msg__action" onClick={onCopy}>
              <Icon name="copy" size={12} />
              {locale.copy}
            </button>
            {role === 'assistant' && (
              <button className="i-chat-msg__action" onClick={onRetry}>
                <Icon name="refresh" size={12} />
                {error ? locale.retry : locale.regenerate}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
