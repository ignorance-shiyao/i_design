/**
 * 把样式文件切成「选择器 + 声明」的块，供样式禁令检查用。
 *
 * 不引 PostCSS：这里只需要块级切分与逐条声明，
 * 而多一个解析器就多一套它自己的边界情况（wxss、Vue SFC 的 <style> 都要能进来）。
 */
import { readFileSync } from 'node:fs'

/** 去掉注释，免得注释里的反例被当成真代码——本文件的说明文字里就有反例 */
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))

/** 一个块：{ selector, body, line } */
export function cssBlocks(text) {
  const src = stripComments(text)
  const blocks = []
  let depth = 0
  let start = 0
  let selectorStart = 0
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]
    if (ch === '{') {
      if (depth === 0) { selectorStart = start; start = i + 1 }
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        const body = src.slice(start, i)
        // 嵌套块（@media 之类）里还有块，递归切开
        if (body.includes('{')) {
          for (const inner of cssBlocks(body)) {
            blocks.push({ ...inner, line: lineOf(src, start) + inner.line - 1 })
          }
        } else {
          blocks.push({
            selector: src.slice(selectorStart, start - 1).trim().split('\n').pop().trim(),
            body,
            line: lineOf(src, start)
          })
        }
        start = i + 1
      }
    } else if (depth === 0 && (ch === ';' || ch === '\n')) {
      if (src.slice(start, i).trim() === '') start = i + 1
    }
  }
  return blocks
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

/** 块里的声明：[{ prop, value }]，值里的换行折成一行方便匹配 */
export function declarations(body) {
  return body
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const at = entry.indexOf(':')
      if (at < 0) return null
      return { prop: entry.slice(0, at).trim(), value: entry.slice(at + 1).replace(/\s+/g, ' ').trim() }
    })
    .filter(Boolean)
}

/** Vue SFC 里的 <style>；普通样式文件原样返回 */
export function styleText(file) {
  const text = readFileSync(file, 'utf8')
  if (!file.endsWith('.vue')) return text
  return [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
}
