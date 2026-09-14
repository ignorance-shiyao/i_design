import { useState } from 'react'
import {
  dedentCode,
  diffLines as buildDiff,
  diffStat,
  tokenizeLines, shouldHighlight, plainLines,
  type CodeToken
} from '@i-design/common'
import { useConfig } from './ConfigProvider'
import { Icon } from './Icon'

/**
 * 代码块。
 *
 * 三件事：高亮、行号、以及「这次改了什么」的统一 diff 视图。
 *
 * 不用 `dangerouslySetInnerHTML` 拼高亮结果，而是按 token 渲染节点。这个库是给
 * AI 交互场景用的，代码块里的内容常常来自模型与工具的输出——那是不可信内容，
 * 拼 HTML 字符串就等于给它开了一条注入路径。
 */
export interface CodeBlockProps {
  code: string
  /** 语言；不传则按内容猜，猜不出就不高亮 */
  lang?: string
  /** 标题栏左侧的文件名；不传则显示语言名 */
  filename?: string
  /** 显示行号 */
  lineNumbers?: boolean
  /** 显示复制按钮 */
  copyable?: boolean
  /** 还在流式输出中：染色阈值收紧，因为每来一片都要重算一次 */
  streaming?: boolean
  /** 改动前的内容。给了就切成统一 diff 视图 */
  before?: string
  /** 超过多少行折叠起来；0 表示不折叠 */
  maxLines?: number
  onCopy?: () => void
  className?: string
}

const renderTokens = (tokens: CodeToken[]) =>
  tokens.map((token, i) => (
    <span key={i} className={`i-code__tok i-code__tok--${token.type}`}>
      {token.text}
    </span>
  ))

export function CodeBlock({
  code,
  lang = '',
  filename = '',
  lineNumbers = true,
  copyable = true,
  streaming = false,
  before = '',
  maxLines = 0,
  onCopy,
  className = ''
}: CodeBlockProps) {
  const { locale } = useConfig()
  const [copied, setCopied] = useState(false)

  /* 首尾空行去掉：模板字符串写出来的代码几乎总是带着它们，留着白占两行 */
  // 归一缩进：示例都写在模板内部，本身带着页面那几层缩进
  const source = dedentCode(code)
  const isDiff = before !== ''
  const diff = isDiff ? buildDiff(dedentCode(before), source) : []
  const stat = diffStat(diff)
  /*
   * 超过阈值就不染色：染色是同步的，五千行 TS 实测 177ms，
   * 而流式输出时每来一片都会把整块重染一遍，用户会发现输入框卡住了。
   * 没有颜色的代码仍然能读，卡住的输入框没法用。
   */
  const lines = shouldHighlight(source, streaming) ? tokenizeLines(source, lang) : plainLines(source)
  const total = isDiff ? diff.length : lines.length
  const clipped = maxLines > 0 && total > maxLines

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      onCopy?.()
    } catch {
      // 剪贴板不可用（非 HTTPS 或未授权）时静默失败：代码仍可手动选中复制
    }
  }

  const classes = ['i-code', isDiff ? 'is-diff' : '', clipped ? 'is-clipped' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className="i-code__bar">
        <span className="i-code__name">{filename || lang || 'text'}</span>
        {/*
          改动统计用文字而不是只用颜色：色觉障碍用户与灰度打印都读不出
          「绿的是加、红的是删」，而「+13 −4」谁都读得出来。
        */}
        {isDiff && (
          <span className="i-code__stat">
            <span className="i-code__stat-add">+{stat.added}</span>
            <span className="i-code__stat-remove">−{stat.removed}</span>
          </span>
        )}
        {copyable && (
          <button className="i-code__copy" type="button" onClick={copy}>
            <Icon name={copied ? 'check' : 'copy'} size={13} />
            {copied ? locale.copied : locale.copy}
          </button>
        )}
      </div>

      {/* 代码区会滚动：不给 tabIndex，只用键盘的人进不去也滚不动 */}
      <pre
        tabIndex={0}
        className="i-code__body"
        style={clipped ? { maxHeight: `calc(${maxLines} * 1.7em)` } : undefined}
      >
        <code>
          {isDiff
            ? diff.map((line, index) => (
                <span key={index} className={`i-code__line i-code__line--${line.kind}`}>
                  {lineNumbers && <span className="i-code__no">{line.before ?? ''}</span>}
                  {lineNumbers && <span className="i-code__no">{line.after ?? ''}</span>}
                  <span className="i-code__sign" aria-hidden="true">
                    {line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' '}
                  </span>
                  {renderTokens(tokenizeLines(line.text, lang)[0] ?? [])}
                  {'\n'}
                </span>
              ))
            : lines.map((line, index) => (
                <span key={index} className="i-code__line">
                  {lineNumbers && <span className="i-code__no">{index + 1}</span>}
                  {renderTokens(line)}
                  {'\n'}
                </span>
              ))}
        </code>
      </pre>
    </div>
  )
}
