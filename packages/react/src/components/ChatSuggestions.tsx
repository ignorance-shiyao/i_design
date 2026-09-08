export interface ChatSuggestionsProps {
  items: string[]
  title?: string
  onSelect?: (item: string) => void
  className?: string
}

/** 放在回答之后：这些是对本轮回答的延伸，挪到输入框旁就成了无上下文的通用入口 */
export function ChatSuggestions({
  items,
  title = '你可以接着问',
  onSelect,
  className = ''
}: ChatSuggestionsProps) {
  if (!items.length) return null

  return (
    <div className={['i-chat-suggestions', className].filter(Boolean).join(' ')}>
      {title && <span className="i-chat-suggestions__title">{title}</span>}
      <div className="i-chat-suggestions__list">
        {items.map((item) => (
          <button key={item} className="i-chat-suggestions__item" onClick={() => onSelect?.(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
