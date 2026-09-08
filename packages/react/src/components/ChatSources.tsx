export interface ChatSource {
  title: string
  url?: string
  /** 来源站点或文件名，展示在标题之后 */
  origin?: string
}

export interface ChatSourcesProps {
  sources: ChatSource[]
  className?: string
}

/** 编号与正文里的角标一一对应：来源必须能被追溯回具体某句话 */
export function ChatSources({ sources, className = '' }: ChatSourcesProps) {
  return (
    <div className={['i-chat-sources', className].filter(Boolean).join(' ')}>
      {sources.map((item, index) => {
        const inner = (
          <>
            <span className="i-chat-sources__index">{index + 1}</span>
            <span className="i-chat-sources__title">{item.title}</span>
          </>
        )
        return item.url ? (
          <a
            key={item.title + index}
            className="i-chat-sources__item"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {inner}
          </a>
        ) : (
          <span key={item.title + index} className="i-chat-sources__item">
            {inner}
          </span>
        )
      })}
    </div>
  )
}
