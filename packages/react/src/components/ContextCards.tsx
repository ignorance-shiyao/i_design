import { useState } from 'react'
import { chunkLength, chunkPreview, fileTypeOf, type ContextChunk } from '@i-design/common'
import { Icon } from './Icon'

export interface ContextCardsProps {
  chunks: ContextChunk[]
  title?: string
  /** 超过这个字符数就折叠，点「展开」看全文 */
  previewLimit?: number
}

export function ContextCards({
  chunks,
  title = '引用片段',
  previewLimit = 140
}: ContextCardsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="i-context">
      <header className="i-context__head">
        {title}
        <span className="i-context__count">{chunks.length}</span>
      </header>

      {chunks.map((chunk) => {
        const length = chunkLength(chunk.content)
        const type = chunk.source ? fileTypeOf(chunk.source) : null
        return (
          <article key={chunk.id} className="i-chunk">
            <div className="i-chunk__head">
              <Icon name="layers" size={14} />
              <span className="i-chunk__title">{chunk.title}</span>
              {/* 字符数而不是 token 数：token 是模型的内部单位，用户无从判断它的含义 */}
              <span className="i-chunk__length">{length} 字</span>
            </div>

            <p className="i-chunk__body">
              {expanded.has(chunk.id) ? chunk.content : chunkPreview(chunk.content, previewLimit)}
            </p>
            {length > previewLimit && (
              <button className="i-chunk__more" onClick={() => toggle(chunk.id)}>
                {expanded.has(chunk.id) ? '收起' : '展开全文'}
              </button>
            )}

            {/* 出处：读者看完片段最常问的下一个问题就是「这句话哪儿来的」 */}
            {chunk.source && type && (
              <a
                className="i-chunk__source"
                href={chunk.href || undefined}
                target={chunk.href ? '_blank' : undefined}
                rel="noreferrer"
                style={
                  { '--i-file-color': `var(--i-chart-${type.slot || 1})` } as React.CSSProperties
                }
              >
                <Icon className="i-chunk__source-icon" name={type.icon} size={13} />
                {chunk.source}
                {chunk.href && <Icon name="external-link" size={11} />}
              </a>
            )}
          </article>
        )
      })}
    </section>
  )
}
