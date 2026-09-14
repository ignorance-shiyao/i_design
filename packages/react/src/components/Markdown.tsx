import type { CSSProperties, ReactNode } from 'react'
import { parseMarkdown, type MdBlock, type MdInline } from '@i-design/common'
import { CodeBlock } from './CodeBlock'

export interface MarkdownProps {
  /** Markdown 原文 */
  source?: string
  /** 紧凑排版：用在气泡、卡片这类空间紧张的地方 */
  compact?: boolean
  className?: string
}

/*
 * 内容来自模型与后端，也就是不可信的地方，所以这里不碰 dangerouslySetInnerHTML：
 * 解析在 @i-design/common 里做成 token 树，这一层只用原生元素渲染。
 * 原始 HTML 当纯文本，地址过白名单——这两条不是可配置项。
 */
function Inline({ nodes }: { nodes: MdInline[] }): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'code':
        return <code key={index} className="i-md__code">{node.text}</code>
      case 'strong':
        return <strong key={index}><Inline nodes={node.children} /></strong>
      case 'em':
        return <em key={index}><Inline nodes={node.children} /></em>
      case 'del':
        return <del key={index}><Inline nodes={node.children} /></del>
      case 'link':
        return (
          <a
            key={index}
            className="i-md__link"
            href={node.href}
            target={node.href.startsWith('http') ? '_blank' : undefined}
            rel={node.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            <Inline nodes={node.children} />
          </a>
        )
      case 'image':
        return <img key={index} className="i-md__image" src={node.src} alt={node.alt} loading="lazy" />
      default:
        return <span key={index}>{node.text}</span>
    }
  })
}

function Blocks({ blocks }: { blocks: MdBlock[] }): ReactNode {
  return blocks.map((block, index) => {
    switch (block.type) {
      case 'heading': {
        const Tag = `h${block.level}` as 'h1'
        return <Tag key={index} className="i-md__heading"><Inline nodes={block.children} /></Tag>
      }
      case 'paragraph':
        return <p key={index} className="i-md__p"><Inline nodes={block.children} /></p>
      case 'code':
        // 还没收完的代码块不给复制按钮：复制到一半的代码比不给复制更坑
        return (
          <CodeBlock
            key={index}
            code={block.text}
            lang={block.lang || undefined}
            copyable={!block.open}
            streaming={block.open}
          />
        )
      case 'quote':
        return <blockquote key={index} className="i-md__quote"><Blocks blocks={block.children} /></blockquote>
      case 'list':
        return block.ordered ? (
          <ol key={index} className="i-md__list" start={block.start}>
            {block.items.map((item, i) => <li key={i}><Blocks blocks={item} /></li>)}
          </ol>
        ) : (
          <ul key={index} className="i-md__list">
            {block.items.map((item, i) => <li key={i}><Blocks blocks={item} /></li>)}
          </ul>
        )
      case 'table':
        return (
          // 表格自己横向滚动：让整页能左右拖比表格里滚更糟
          <div key={index} className="i-md__table-wrap">
            <table className="i-md__table">
              <thead>
                <tr>
                  {block.head.map((cell, c) => (
                    <th key={c} style={{ textAlign: block.align[c] ?? undefined } as CSSProperties}>
                      <Inline nodes={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c} style={{ textAlign: block.align[c] ?? undefined } as CSSProperties}>
                        <Inline nodes={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      default:
        return <hr key={index} className="i-md__hr" />
    }
  })
}

export function Markdown({ source = '', compact = false, className = '' }: MarkdownProps) {
  const blocks = parseMarkdown(source)
  return (
    <div className={['i-md', compact ? 'is-compact' : '', className].filter(Boolean).join(' ')}>
      <Blocks blocks={blocks} />
    </div>
  )
}
