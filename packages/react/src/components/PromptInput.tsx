import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  applyMention,
  fileTypeOf,
  filterMentions,
  findMention,
  formatSize,
  moveCommandIndex
} from '@i-design/common'
import { useConfig } from './ConfigProvider'
import { useFlipMove } from './useFlipMove'
import { Icon } from './Icon'

export interface PromptAttachment {
  name: string
  size?: number
}

/** `@` 引用与 `/` 命令共用一种候选项 */
export interface PromptOption {
  label: string
  /** 副标题：来源的路径、命令的一句说明 */
  description?: string
  /** 额外可搜的词：英文名、别名 */
  keywords?: string[]
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
  /** 打 `@` 时可引用的来源；不给就不弹 */
  mentions?: PromptOption[]
  /** 打 `/` 时可用的命令；不给就不弹 */
  commands?: PromptOption[]
  onChange?: (value: string) => void
  /** 选中了一个候选项。symbol 区分是 @ 还是 / */
  onPick?: (option: PromptOption, symbol: string) => void
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
  placeholder = '',
  disabled = false,
  generating = false,
  maxLength = 0,
  attachments = [],
  hint = '',
  submitOnEnter = true,
  mentions = [],
  commands = [],
  onChange,
  onPick,
  onSubmit,
  onStop,
  onAttach,
  onRemoveAttachment,
  tools,
  className = ''
}: PromptInputProps) {
  /* 占位与按钮名都走字典：写死中文的话，换成英文字典后这一块会是唯一还说中文的地方 */
  const { locale } = useConfig()
  const field = useRef<HTMLTextAreaElement>(null)
  const files = useRef<HTMLDivElement | null>(null)
  const [focused, setFocused] = useState(false)
  const [trigger, setTrigger] = useState<{ at: number; symbol: string; query: string } | null>(null)
  const [active, setActive] = useState(0)
  /*
   * Esc 关掉之后，光标还停在同一段 `@…` 上，下一次按键又会把它算出来。
   * 记住被关掉的是哪一段，直到用户挪到别处或改写这一段为止——否则 Esc 等于没按。
   */
  const dismissed = useRef<number | null>(null)
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

  /* 移除一个附件时让后面的平滑补位，而不是整排瞬移；类名与 Vue 端同一个 */
  useFlipMove(files, 'i-prompt-file', attachments.map((f) => f.name).join('|'))

  const symbols = [...(mentions.length ? ['@'] : []), ...(commands.length ? ['/'] : [])]
  const options = trigger
    ? filterMentions(trigger.symbol === '/' ? commands : mentions, trigger.query)
    : []
  /*
   * 候选面板只在真有候选时出现。
   * 一个空面板比没有面板更糟：它挡住正文，还把回车键抢走。
   */
  const panelOpen = !!trigger && options.length > 0

  function syncTrigger() {
    const el = field.current
    if (!el || !symbols.length) return
    const next = findMention(el.value, el.selectionStart ?? el.value.length, symbols)
    if (!next || next.at !== dismissed.current) dismissed.current = null
    // 触发段变了就把高亮拉回第一条：停在原来的序号上会指到一条完全不相干的候选
    if (next?.at !== trigger?.at || next?.query !== trigger?.query) setActive(0)
    setTrigger(next && next.at === dismissed.current ? null : next)
  }

  function pick(option: PromptOption) {
    const el = field.current
    if (!el || !trigger) return
    const caret = el.selectionStart ?? el.value.length
    const next = applyMention(value, trigger, option.label, caret)
    onChange?.(next.text)
    onPick?.(option, trigger.symbol)
    setTrigger(null)
    dismissed.current = null
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(next.caret, next.caret)
    })
  }

  function submit() {
    if (!canSend) return
    onSubmit?.(value)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    /*
     * 候选面板开着时，方向键与回车归面板用。
     * 不这么让的话，用户刚打出 `@张` 按回车，发出去的是半截问题。
     */
    if (panelOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive(moveCommandIndex(active, 1, options.length))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive(moveCommandIndex(active, -1, options.length))
        return
      }
      if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
        event.preventDefault()
        pick(options[active])
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        dismissed.current = trigger?.at ?? null
        setTrigger(null)
        return
      }
    }

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
      {/*
        候选面板压在输入台上方而不是下方：输入台本身多半贴着页面底部，
        往下弹会被视口边缘切掉。
      */}
      {panelOpen && (
        <ul className="i-prompt__panel" role="listbox">
          {options.map((option, index) => (
            <li
              key={option.label}
              className={`i-prompt__option${index === active ? ' is-active' : ''}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(option)
              }}
              onMouseMove={() => setActive(index)}
            >
              <span className="i-prompt__option-label">
                {trigger?.symbol}
                {option.label}
              </span>
              {option.description && (
                <span className="i-prompt__option-desc">{option.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {attachments.length > 0 && (
        <div ref={files} className="i-prompt__attachments">
          {attachments.map((file, index) => (
            <span
              key={file.name + index}
              // 补位过渡靠这个键认人，下标会随删除整体前移，认不出来
              data-flip-key={file.name}
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
                aria-label={locale.removeAttachmentText(file.name)}
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
        placeholder={placeholder || locale.promptPlaceholder}
        disabled={disabled}
        onChange={(e) => {
          onChange?.(e.target.value)
          syncTrigger()
        }}
        onKeyDown={onKeyDown}
        onClick={syncTrigger}
        onKeyUp={syncTrigger}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={() => (composing.current = false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      <div className="i-prompt__bar">
        <div className="i-prompt__tools">
          <button className="i-prompt__tool" onClick={onAttach}>
            <Icon name="plus" size={14} />
            {locale.attach}
          </button>
          {tools}
        </div>

        {maxLength > 0 && (
          <span className={['i-prompt__count', over ? 'is-over' : ''].filter(Boolean).join(' ')}>
            {value.length} / {maxLength}
          </span>
        )}

        {generating ? (
          <button className="i-prompt__send is-stop" aria-label={locale.stopGenerating} onClick={onStop}>
            <Icon name="close" size={14} />
          </button>
        ) : (
          <button
            className="i-prompt__send"
            aria-label={locale.send}
            disabled={!canSend}
            onClick={submit}
          >
            <Icon name="arrow-right" size={16} />
          </button>
        )}
      </div>

      {hint && <p className="i-prompt__hint">{hint}</p>}
    </div>
  )
}
