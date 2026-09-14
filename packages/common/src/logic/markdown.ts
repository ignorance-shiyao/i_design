/**
 * Markdown → 结构化 token，**不产出 HTML 字符串**。
 *
 * 这一层的设计只有一个出发点：内容来自模型与后端，也就是不可信的地方。
 * 主流做法是「渲染成 HTML 再清洗」，那要求清洗器穷举所有变形，
 * 漏一种就等于给了对方一个 XSS；而且 HTML 字符串没法在小程序与 Flutter 上渲染，
 * 各端只能各写一套解析。
 *
 * 所以这里解析成 token 树，由各端用自己的原生元素渲染：
 * 原始 HTML 一律当纯文本，地址一律过 safeHref——这两条不是可配置项。
 *
 * 支持的语法按「模型真的会输出什么」取舍：标题、段落、列表（含嵌套一层）、
 * 有序列表、代码块、行内代码、引用、表格、分割线、粗体、斜体、删除线、
 * 链接、图片。不支持脚注、定义列表、HTML 内嵌——它们在对话里几乎不出现，
 * 而每多支持一种就多一处要防的地方。
 */
import { safeHref } from './href'

export type MdInline =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'strong'; children: MdInline[] }
  | { type: 'em'; children: MdInline[] }
  | { type: 'del'; children: MdInline[] }
  | { type: 'link'; href: string; children: MdInline[] }
  | { type: 'image'; src: string; alt: string }

export type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: MdInline[] }
  | { type: 'paragraph'; children: MdInline[] }
  | { type: 'code'; lang: string; text: string; /** 流式过程中还没收到结尾围栏 */ open: boolean }
  | { type: 'quote'; children: MdBlock[] }
  | { type: 'list'; ordered: boolean; start: number; items: MdBlock[][] }
  | { type: 'table'; head: MdInline[][]; rows: MdInline[][][]; align: ('left' | 'center' | 'right' | null)[] }
  | { type: 'hr' }

/* ───────────────────────── 行内 ───────────────────────── */

/*
 * 地址部分要一路吃到配对的右括号，而不是「吃到第一个右括号为止」。
 *
 * 后者有两个真实后果：`(javascript:alert(1))` 会在第一个 `)` 处截断，
 * 剩下一个孤零零的 `)` 落到正文里；更糟的是 `(java\tscript:alert(1))`
 * ——按「不含空白」截取会得到地址 `java`，那是个合法的相对路径，
 * 于是一个恶意地址被解析成了一个看似正常的链接。所以整段原样交给 safeHref，
 * 由它统一拒绝，而不是在这里先切一刀。
 */
const URL_PART = '((?:[^()]|\\([^()]*\\))*)'
const INLINE = new RegExp(
  '(`+)([\\s\\S]*?)\\1' +
  `|!\\[([^\\]]*)\\]\\(${URL_PART}\\)` +
  `|\\[([^\\]]+)\\]\\(${URL_PART}\\)` +
  '|(\\*\\*|__)([\\s\\S]+?)\\7' +
  '|(\\*|_)([\\s\\S]+?)\\9' +
  '|~~([\\s\\S]+?)~~'
)

/** 去掉地址后面的可选标题：`(/a "说明")` */
const urlOf = (raw: string) => raw.replace(/\s+["'(][\s\S]*$/, '').trim()

/**
 * 行内解析。
 *
 * 代码优先：`` `**不是粗体**` `` 里的星号必须原样显示，否则粘一段代码进来，
 * 界面上会莫名其妙地加粗一半。
 */
export function parseInline(text: string): MdInline[] {
  const out: MdInline[] = []
  let rest = text
  while (rest) {
    const hit = INLINE.exec(rest)
    if (!hit || hit.index === undefined) break
    if (hit.index > 0) out.push({ type: 'text', text: rest.slice(0, hit.index) })
    const [matched, , codeText, alt, src, linkText, href, , strongText, , emText, delText] = hit

    if (codeText !== undefined) {
      out.push({ type: 'code', text: codeText.trim() })
    } else if (src !== undefined) {
      // 地址不安全时退化成替代文本：渲染一个点了会出事的图不如不渲染
      const safe = safeHref(urlOf(src))
      if (safe) out.push({ type: 'image', src: safe, alt: alt ?? '' })
      else out.push({ type: 'text', text: alt || src })
    } else if (href !== undefined) {
      const safe = safeHref(urlOf(href))
      if (safe) out.push({ type: 'link', href: safe, children: parseInline(linkText) })
      else out.push(...parseInline(linkText))
    } else if (strongText !== undefined) {
      out.push({ type: 'strong', children: parseInline(strongText) })
    } else if (emText !== undefined) {
      out.push({ type: 'em', children: parseInline(emText) })
    } else if (delText !== undefined) {
      out.push({ type: 'del', children: parseInline(delText) })
    }
    rest = rest.slice(hit.index + matched.length)
  }
  if (rest) out.push({ type: 'text', text: rest })
  return out.length ? out : [{ type: 'text', text: '' }]
}

/* ───────────────────────── 块级 ───────────────────────── */

const isHr = (line: string) => /^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(line)
const listMark = (line: string) => /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/.exec(line)

function parseTableRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

const alignOf = (cell: string): 'left' | 'center' | 'right' | null => {
  const left = cell.startsWith(':')
  const right = cell.endsWith(':')
  if (left && right) return 'center'
  if (right) return 'right'
  if (left) return 'left'
  return null
}

/**
 * 块级解析。
 *
 * 流式是常态而不是例外：模型一边写一边渲染，随时可能停在代码块中间。
 * 停在中间时按「还没收完的代码块」渲染（open: true），而不是把围栏当普通文字，
 * 否则用户会看到满屏的反引号，写完的一瞬间又整段跳变。
 */
export function parseMarkdown(source: string): MdBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: MdBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) { i += 1; continue }

    // 代码围栏
    const fence = /^ {0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/.exec(line)
    if (fence) {
      const [, mark, lang] = fence
      const body: string[] = []
      i += 1
      let closed = false
      while (i < lines.length) {
        if (new RegExp(`^ {0,3}${mark[0]}{${mark.length},}\\s*$`).test(lines[i])) { closed = true; i += 1; break }
        body.push(lines[i])
        i += 1
      }
      blocks.push({ type: 'code', lang: lang || '', text: body.join('\n'), open: !closed })
      continue
    }

    if (isHr(line)) { blocks.push({ type: 'hr' }); i += 1; continue }

    const heading = /^ {0,3}(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        children: parseInline(heading[2].replace(/\s+#+\s*$/, ''))
      })
      i += 1
      continue
    }

    if (/^ {0,3}>\s?/.test(line)) {
      const body: string[] = []
      while (i < lines.length && (/^ {0,3}>\s?/.test(lines[i]) || lines[i].trim())) {
        if (!/^ {0,3}>\s?/.test(lines[i])) break
        body.push(lines[i].replace(/^ {0,3}>\s?/, ''))
        i += 1
      }
      blocks.push({ type: 'quote', children: parseMarkdown(body.join('\n')) })
      continue
    }

    // 表格：第二行必须是分隔行，否则那只是一段带竖线的普通文字
    if (line.includes('|') && i + 1 < lines.length && /^[\s|:-]+$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const head = parseTableRow(line).map(parseInline)
      const align = parseTableRow(lines[i + 1]).map(alignOf)
      i += 2
      const rows: MdInline[][][] = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(parseTableRow(lines[i]).map(parseInline))
        i += 1
      }
      blocks.push({ type: 'table', head, align, rows })
      continue
    }

    const mark = listMark(line)
    if (mark) {
      const ordered = /\d/.test(mark[2])
      const start = ordered ? Number.parseInt(mark[2], 10) : 1
      const items: MdBlock[][] = []
      const baseIndent = mark[1].length
      while (i < lines.length) {
        const current = listMark(lines[i])
        if (!current || current[1].length < baseIndent) break
        if (/\d/.test(current[2]) !== ordered && current[1].length === baseIndent) break
        if (current[1].length > baseIndent) {
          // 缩进的行属于上一项：收集起来递归解析，嵌套列表就是这么来的
          const nested: string[] = []
          while (i < lines.length) {
            const deeper = listMark(lines[i])
            if (!deeper || deeper[1].length <= baseIndent) break
            nested.push(lines[i].slice(baseIndent + 2))
            i += 1
          }
          const last = items[items.length - 1]
          if (last) last.push(...parseMarkdown(nested.join('\n')))
          continue
        }
        items.push(parseMarkdown(current[3]))
        i += 1
      }
      blocks.push({ type: 'list', ordered, start, items })
      continue
    }

    // 段落：连续的非空行合成一段
    const paragraph: string[] = []
    while (i < lines.length && lines[i].trim() && !listMark(lines[i]) && !isHr(lines[i])
      && !/^ {0,3}(#{1,6})\s/.test(lines[i]) && !/^ {0,3}(`{3,}|~{3,})/.test(lines[i])
      && !/^ {0,3}>\s?/.test(lines[i])) {
      paragraph.push(lines[i])
      i += 1
    }
    if (paragraph.length) blocks.push({ type: 'paragraph', children: parseInline(paragraph.join('\n')) })
    else i += 1
  }

  return blocks
}

/** 取纯文本，用于摘要、搜索与复制 */
export function markdownText(blocks: MdBlock[]): string {
  const inline = (nodes: MdInline[]): string =>
    nodes.map((n) => {
      if (n.type === 'text' || n.type === 'code') return n.text
      if (n.type === 'image') return n.alt
      return inline(n.children)
    }).join('')

  return blocks.map((block) => {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
        return inline(block.children)
      case 'code':
        return block.text
      case 'quote':
        return markdownText(block.children)
      case 'list':
        return block.items.map((item) => markdownText(item)).join('\n')
      case 'table':
        return [block.head, ...block.rows].map((row) => row.map(inline).join('\t')).join('\n')
      default:
        return ''
    }
  }).filter(Boolean).join('\n\n')
}
