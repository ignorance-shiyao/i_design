import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { fileTypeOf, formatSize } from '@i-design/common'
import { Icon } from './Icon'

export interface PromptAttachment {
  name: string
  size?: number
}

export interface PromptInputProps {
  value?: string
  placeholder?: string
  disabled?: boolean
  /** 正在生成：发送按钮变为停止，输入仍可继续 */
  generating?: boolean
  maxLength?: number
  attachments?: PromptAttachment[]
  hint?: string
  /** 回车发送；关掉后回车换行、Ctrl/Cmd + 回车发送 */
  submitOnEnter?: boolean
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  onStop?: () => void
  onAttach?: () => void
  onRemoveAttachment?: (index: number) => void
  /** 附件按钮之后的自定义工具，如模型选择 */
  tools?: ReactNode
  className?: string
}

export function PromptInput({
  value = '',
  placeholder = '问点什么…',
  disabled = false,
  generating = false,
  maxLength = 0,
  attachments = [],
  hint = '',
  submitOnEnter = true,
  onChange,
  onSubmit,
  onStop,
  onAttach,
  onRemoveAttachment,
  tools,
  className = ''
}: PromptInputProps) {
  const field = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)
  // 组字状态由 composition 事件维护：输入法确认候选词的回车不能当成发送
  const composing = useRef(false)

  const over = maxLength > 0 && value.length > maxLength
  const canSend = !disabled && !over && value.trim().length > 0

  /** 高度跟随内容：先归零再取 scrollHeight，否则删字时高度只增不减 */
  useLayoutEffect(() => {
    const el = field.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  function submit() {
    if (!canSend) return
    onSubmit?.(value)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter') return
    if (composing.current || event.nativeEvent.isComposing) return

    const withModifier = event.metaKey || event.ctrlKey
    if (submitOnEnter ? !event.shiftKey && !withModifier : withModifier) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div
      className={['i-prompt', focused ? 'is-focused' : '', disabled ? 'is-disabled' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {attachments.length > 0 && (
        <div className="i-prompt__attachments">
          {attachments.map((file, index) => (
            <span
              key={file.name + index}
              className="i-prompt__file"
              style={
                {
                  '--i-file-color': `var(--i-chart-${fileTypeOf(file.name).slot || 1})`
                } as React.CSSProperties
              }
            >
              {/* 类型色只上在图标上，文件名保持正文色：彩色文件名会和链接混淆 */}
              <span className="i-prompt__file-icon">
                <Icon name={fileTypeOf(file.name).icon} size={14} />
              </span>
              <span className="i-prompt__file-name">{file.name}</span>
              {/* 颜色不作为唯一线索：类型名同时以文字给出 */}
              <span className="i-prompt__file-meta">
                {fileTypeOf(file.name).label}
                {file.size ? ` · ${formatSize(file.size)}` : ''}
              </span>
              <button
                className="i-prompt__file-remove"
                aria-label={`移除 ${file.name}`}
                onClick={() => onRemoveAttachment?.(index)}
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <textarea
        ref={field}
        className="i-prompt__field"
        rows={1}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={onKeyDown}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={() => (composing.current = false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      <div className="i-prompt__bar">
        <div className="i-prompt__tools">
          <button className="i-prompt__tool" onClick={onAttach}>
            <Icon name="plus" size={14} />
            附件
          </button>
          {tools}
        </div>

        {maxLength > 0 && (
          <span className={['i-prompt__count', over ? 'is-over' : ''].filter(Boolean).join(' ')}>
            {value.length} / {maxLength}
          </span>
        )}

        {generating ? (
          <button className="i-prompt__send is-stop" aria-label="停止生成" onClick={onStop}>
            <Icon name="close" size={14} />
          </button>
        ) : (
          <button className="i-prompt__send" aria-label="发送" disabled={!canSend} onClick={submit}>
            <Icon name="arrow-right" size={16} />
          </button>
        )}
      </div>

      {hint && <p className="i-prompt__hint">{hint}</p>}
    </div>
  )
}
