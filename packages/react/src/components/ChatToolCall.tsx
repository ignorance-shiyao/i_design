import { useState } from 'react'
import { Icon } from './Icon'
import { Loading } from './Loading'

export interface ChatToolCallProps {
  name: string
  /** 一句话说明这次调用在做什么，折叠时展示 */
  summary?: string
  status?: 'running' | 'success' | 'error'
  args?: unknown
  result?: unknown
  error?: string
  defaultOpen?: boolean
  className?: string
}

/** 对象转 JSON 展示；字符串原样输出，避免多一层引号 */
function format(value: unknown) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export function ChatToolCall({
  name,
  summary = '',
  status = 'success',
  args,
  result,
  error = '',
  defaultOpen = false,
  className = ''
}: ChatToolCallProps) {
  // 失败的调用默认展开：这时用户要看的正是出了什么错
  const [open, setOpen] = useState(defaultOpen || status === 'error')

  return (
    <section
      className={['i-chat-tool', `i-chat-tool--${status}`, open ? 'is-open' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <button className="i-chat-tool__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon className="i-chat-tool__arrow" name="chevron-right" size={14} />
        <code className="i-chat-tool__name">{name}</code>
        <span className="i-chat-tool__summary">{summary}</span>
        <span className="i-chat-tool__status">
          {status === 'running' ? <Loading size="sm" /> : (
            <Icon name={status === 'error' ? 'error-circle' : 'check-circle'} size={14} />
          )}
        </span>
      </button>

      {open && (
        <div className="i-chat-tool__body">
          {args !== undefined && (
            <div className="i-chat-tool__section">
              <span className="i-chat-tool__label">入参</span>
              <pre className="i-chat-tool__code">{format(args)}</pre>
            </div>
          )}
          {error ? (
            <div className="i-chat-tool__section">
              <span className="i-chat-tool__label">错误</span>
              <p className="i-chat-tool__error">{error}</p>
            </div>
          ) : (
            result !== undefined && (
              <div className="i-chat-tool__section">
                <span className="i-chat-tool__label">结果</span>
                <pre className="i-chat-tool__code">{format(result)}</pre>
              </div>
            )
          )}
        </div>
      )}
    </section>
  )
}
