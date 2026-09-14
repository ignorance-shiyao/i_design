/**
 * Markdown 解析的回归测试。
 *
 * 一半的用例是安全用例：内容来自模型与后端，也就是不可信的地方。
 * 另一半是流式——模型一边写一边渲染，随时可能停在任何一个位置上。
 */
import { describe, expect, it } from 'vitest'
import { markdownText, parseInline, parseMarkdown, type MdBlock } from './markdown'

const first = (source: string): MdBlock => parseMarkdown(source)[0]

describe('安全', () => {
  it('原始 HTML 当纯文本，不解析也不渲染', () => {
    const block = first('<img src=x onerror="alert(1)"> 正文')
    expect(block.type).toBe('paragraph')
    expect(markdownText([block])).toBe('<img src=x onerror="alert(1)"> 正文')
  })

  it('javascript: 链接退化成纯文本，而不是一个点了会出事的链接', () => {
    const nodes = parseInline('[点我](javascript:alert(1))')
    expect(nodes.every((n) => n.type !== 'link')).toBe(true)
    expect(nodes.map((n) => (n.type === 'text' ? n.text : '')).join('')).toBe('点我')
  })

  it('中间插控制字符的 java\\tscript: 同样拒绝——浏览器解析前会把它剔掉', () => {
    expect(parseInline('[x](java\tscript:alert(1))').every((n) => n.type !== 'link')).toBe(true)
  })

  it('图片地址不安全时退化成替代文本', () => {
    const [node] = parseInline('![风险图](javascript:x)')
    expect(node).toEqual({ type: 'text', text: '风险图' })
  })

  it('正常的 http 链接与相对路径照常放行', () => {
    expect(parseInline('[文档](https://example.com/a)')[0]).toMatchObject({ type: 'link', href: 'https://example.com/a' })
    expect(parseInline('[本页](/components/button)')[0]).toMatchObject({ type: 'link', href: '/components/button' })
  })
})

describe('行内', () => {
  it('代码优先于强调——粘一段代码进来不该被加粗一半', () => {
    const nodes = parseInline('`**不是粗体**` 与 **是粗体**')
    expect(nodes[0]).toEqual({ type: 'code', text: '**不是粗体**' })
    expect(nodes.some((n) => n.type === 'strong')).toBe(true)
  })

  it('粗体、斜体、删除线各自成节点', () => {
    expect(parseInline('**粗**')[0].type).toBe('strong')
    expect(parseInline('*斜*')[0].type).toBe('em')
    expect(parseInline('~~删~~')[0].type).toBe('del')
  })
})

describe('块级', () => {
  it('标题、分割线、引用', () => {
    expect(first('## 标题')).toMatchObject({ type: 'heading', level: 2 })
    expect(first('---')).toEqual({ type: 'hr' })
    const quote = first('> 引用的一句')
    expect(quote.type).toBe('quote')
    expect(markdownText([quote])).toBe('引用的一句')
  })

  it('列表能嵌套一层，有序列表记住起始序号', () => {
    const list = first('1. 第一\n2. 第二')
    expect(list).toMatchObject({ type: 'list', ordered: true, start: 1 })
    const nested = first('- 外层\n  - 内层')
    expect(nested.type).toBe('list')
    expect(markdownText([nested])).toContain('内层')
  })

  it('表格要有分隔行才算表格——否则那只是一段带竖线的文字', () => {
    const table = first('| 单号 | 金额 |\n| --- | ---: |\n| SO-1 | 12 |')
    expect(table).toMatchObject({ type: 'table', align: [null, 'right'] })
    expect((table as { rows: unknown[] }).rows).toHaveLength(1)
    expect(first('这一段 | 带了竖线 | 但不是表格').type).toBe('paragraph')
  })

  it('代码块记住语言', () => {
    expect(first('```ts\nconst a = 1\n```')).toMatchObject({ type: 'code', lang: 'ts', open: false })
  })
})

describe('流式', () => {
  it('停在代码块中间时按「还没收完」渲染，而不是满屏反引号', () => {
    const block = first('```ts\nconst a = 1')
    expect(block).toMatchObject({ type: 'code', lang: 'ts', open: true, text: 'const a = 1' })
  })

  it('逐字符喂进来的每一步都能解析，不抛错', () => {
    const full = '# 标题\n\n正文 **粗** 与 `代码`\n\n```ts\nconst a = 1\n```\n\n| a | b |\n| --- | --- |\n| 1 | 2 |'
    for (let i = 1; i <= full.length; i += 1) {
      expect(() => parseMarkdown(full.slice(0, i))).not.toThrow()
    }
  })

  it('写完的那一刻结构稳定：最后一步与完整文本解析结果一致', () => {
    const full = '正文\n\n```ts\nconst a = 1\n```'
    expect(parseMarkdown(full)).toEqual(parseMarkdown(`${full}\n`))
  })
})
