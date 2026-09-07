/**
 * 把 SINGLE_FILE 构建产物转成 Artifact 可发布的片段：
 * Artifact 会自行包裹 <!doctype html><head>…</head><body>，
 * 因此这里剥掉外层文档结构，只保留 <title>、<style>、<script> 与挂载点。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const src = 'dist-single/index.html'
const out = 'preview/index.html'

const html = readFileSync(src, 'utf8')

const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Ignorance Design'
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0])
const scripts = [...html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0])

if (!scripts.length) {
  console.error('未找到内联脚本，检查 vite-plugin-singlefile 是否生效')
  process.exit(1)
}

mkdirSync('preview', { recursive: true })
writeFileSync(
  out,
  [`<title>${title}</title>`, ...styles, '<div id="app"></div>', ...scripts].join('\n')
)

const kb = (Buffer.byteLength(readFileSync(out)) / 1024).toFixed(0)
console.log(`已生成 ${out}（${kb} KB）`)
