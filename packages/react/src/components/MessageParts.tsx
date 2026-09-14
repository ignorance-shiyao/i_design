import type { MessagePart } from '@i-design/common'
import { CodeBlock } from './CodeBlock'
import { Icon } from './Icon'
import { Markdown } from './Markdown'

export interface MessagePartsProps {
  parts?: MessagePart[]
  /** 引用编号对应的来源标题，用于把角标写成人能读的东西 */
  sources?: { id: string; title: string }[]
  compact?: boolean
  /** 点了引用角标：把来源定位出来是调用方的事，组件只说点了哪一个 */
  onCite?: (sourceId: string) => void
  className?: string
}

/*
 * 模型的一次回答不是一块纯文本：正文、推理、代码、工具调用、产物、引用
 * 会交替出现，而且每一段的收尾时间不同。拼成一个字符串再渲染，
 * 会丢掉「这一段还没收完」这个信息——而那正是流式界面最需要表达的东西。
 */
export function MessageParts({
  parts = [],
  sources = [],
  compact = false,
  onCite,
  className = ''
}: MessagePartsProps) {
  const sourceTitle = (id: string) => sources.find((s) => s.id === id)?.title ?? id

  // 引用按出现顺序编号：读者看到的是 [1][2]，不是一串 uuid
  const citeIndex = new Map<string, number>()
  for (const part of parts) {
    if (part.kind !== 'citation') continue
    const id = part.meta?.sourceId ?? part.text
    if (!citeIndex.has(id)) citeIndex.set(id, citeIndex.size + 1)
  }

  return (
    <div className={['i-msg-parts', compact ? 'is-compact' : '', className].filter(Boolean).join(' ')}>
      {parts.map((part) => {
        switch (part.kind) {
          case 'text':
            return <Markdown key={part.id} source={part.text} compact={compact} />
          case 'reasoning':
            // 推理过程默认折叠：它是给愿意深究的人看的，不该挤掉结论
            return (
              <details key={part.id} className="i-msg-parts__reasoning">
                <summary>
                  <Icon name="sparkle" size={14} />
                  {`推理过程${part.complete ? '' : '（进行中）'}`}
                </summary>
                <Markdown source={part.text} compact />
              </details>
            )
          case 'code':
            return (
              <CodeBlock
                key={part.id}
                code={part.text}
                lang={part.meta?.lang}
                copyable={part.complete}
                streaming={!part.complete}
              />
            )
          case 'tool':
            return (
              <div key={part.id} className="i-msg-parts__chip">
                <span className="i-msg-parts__chip-icon"><Icon name="code" size={14} /></span>
                <span>{part.meta?.name ?? '工具调用'}</span>
                <span className="i-msg-parts__chip-state">{part.complete ? '已完成' : '执行中'}</span>
              </div>
            )
          case 'artifact':
            return (
              <div key={part.id} className="i-msg-parts__chip">
                <span className="i-msg-parts__chip-icon"><Icon name="file-text" size={14} /></span>
                <span>{part.meta?.title ?? '产物'}</span>
                {part.meta?.version ? (
                  <span className="i-msg-parts__chip-state">{`v${part.meta.version}`}</span>
                ) : null}
              </div>
            )
          default: {
            // 引用角标可点、可聚焦：只显示一个上标数字而点不动，等于把出处藏起来了
            const id = part.meta?.sourceId ?? part.text
            return (
              <button
                key={part.id}
                className="i-msg-parts__cite"
                type="button"
                aria-label={`引用 ${citeIndex.get(id)}：${sourceTitle(id)}`}
                onClick={() => onCite?.(id)}
              >
                {`[${citeIndex.get(id)}]`}
              </button>
            )
          }
        }
      })}
    </div>
  )
}
