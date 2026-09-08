/**
 * 等待首个字符时的三点提示。
 * 一旦开始流式输出就应换成 ChatMessage 的光标，
 * 否则同一条消息上会同时出现两种「正在进行」的信号。
 */
export function ChatTyping({ className = '' }: { className?: string }) {
  return (
    <div className={['i-chat-typing', className].filter(Boolean).join(' ')} role="status" aria-label="正在生成回答">
      <span className="i-chat-typing__dot" />
      <span className="i-chat-typing__dot" />
      <span className="i-chat-typing__dot" />
    </div>
  )
}
