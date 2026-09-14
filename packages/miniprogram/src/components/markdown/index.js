/**
 * Markdown —— 小程序实现。
 *
 * 解析与 Web 端同一份（@i-design/common 的 parseMarkdown）：
 * 小程序端最容易走的捷径是 rich-text + 一段自制的 HTML 清洗，
 * 而那正是要避免的——清洗要穷举所有变形，漏一种就等于把不可信内容直接注进页面。
 *
 * WXML 不能递归调用组件，所以这里把块与行内压平成「带层级标记的平铺列表」，
 * 由模板按标记渲染。嵌套只到列表里的块这一层，够用且可控。
 */
import { parseMarkdown } from '@i-design/common'

/** 行内节点压平成一串带样式标记的片段 */
function flattenInline(nodes, style = {}) {
  const out = []
  for (const node of nodes) {
    if (node.type === 'text') out.push({ ...style, kind: 'text', text: node.text })
    else if (node.type === 'code') out.push({ ...style, kind: 'code', text: node.text })
    else if (node.type === 'image') out.push({ kind: 'image', src: node.src, alt: node.alt })
    else if (node.type === 'link') out.push(...flattenInline(node.children, { ...style, link: node.href }))
    else if (node.type === 'strong') out.push(...flattenInline(node.children, { ...style, strong: true }))
    else if (node.type === 'em') out.push(...flattenInline(node.children, { ...style, em: true }))
    else if (node.type === 'del') out.push(...flattenInline(node.children, { ...style, del: true }))
  }
  return out
}

function flattenBlocks(blocks, depth = 0) {
  const out = []
  for (const block of blocks) {
    if (block.type === 'heading') {
      out.push({ kind: 'heading', level: block.level, depth, inline: flattenInline(block.children) })
    } else if (block.type === 'paragraph') {
      out.push({ kind: 'paragraph', depth, inline: flattenInline(block.children) })
    } else if (block.type === 'code') {
      out.push({ kind: 'code', depth, text: block.text, lang: block.lang })
    } else if (block.type === 'quote') {
      out.push({ kind: 'quote-open', depth })
      out.push(...flattenBlocks(block.children, depth + 1))
      out.push({ kind: 'quote-close', depth })
    } else if (block.type === 'list') {
      block.items.forEach((item, index) => {
        out.push({
          kind: 'list-item',
          depth,
          marker: block.ordered ? `${block.start + index}.` : '•'
        })
        out.push(...flattenBlocks(item, depth + 1))
      })
    } else if (block.type === 'table') {
      out.push({
        kind: 'table',
        depth,
        head: block.head.map(flattenInline),
        rows: block.rows.map((row) => row.map(flattenInline)),
        align: block.align
      })
    } else if (block.type === 'hr') {
      out.push({ kind: 'hr', depth })
    }
  }
  return out
}

Component({
  options: { addGlobalClass: true },
  properties: {
    source: { type: String, value: '' },
    compact: { type: Boolean, value: false }
  },
  data: { nodes: [] },
  observers: {
    source(source) {
      this.setData({ nodes: flattenBlocks(parseMarkdown(source)) })
    }
  }
})
