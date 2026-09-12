/**
 * 每个组件文档页都要有「什么时候不该用它」。
 *
 * API 表说的是「这个组件能设哪些属性」，而读者真正要做的判断是
 * 「这件事该不该用这个组件」。后者没人写，于是选型全靠猜——
 * 选项只有三个也用下拉、一次性提示也用常驻横幅、页面主线内容折叠起来。
 * 这类判断比 API 表值钱得多，也更难从代码里反推出来，所以它必须写在页面上。
 *
 * 放进 check:parity 是因为：少一节不会让构建失败，也不会让任何测试变红，
 * 新加的页面只会静悄悄地缺着，直到某天有人问「这个到底什么时候用」。
 */
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'

const HEADING = '什么时候不该用它'
/** 至少给三条。给一条的话，多半是把某个具体限制当成了选型建议 */
const MIN_ITEMS = 3

export function auditPage(source) {
  const at = source.indexOf(`<h2>${HEADING}</h2>`)
  if (at < 0) return { ok: false, reason: '缺这一节' }
  const rest = source.slice(at)
  const list = rest.slice(0, rest.indexOf('</ul>'))
  const items = list.match(/<li>/g)?.length ?? 0
  if (items < MIN_ITEMS) return { ok: false, reason: `只有 ${items} 条，至少要 ${MIN_ITEMS} 条` }
  return { ok: true }
}

if (process.argv[1] && process.argv[1].endsWith('check-when-not.mjs')) {
  const files = globSync('src/pages/components/*.vue')
  const bad = []
  for (const file of files) {
    const result = auditPage(readFileSync(file, 'utf8'))
    if (!result.ok) bad.push(`${file} — ${result.reason}`)
  }

  if (bad.length) {
    console.error(
      `以下文档页没写「${HEADING}」（${bad.length} 个）：\n  ${bad.join('\n  ')}\n` +
        '写三条即可，一条一个具体场景加一句原因；这比再补几行 API 表有用。'
    )
    process.exit(1)
  }
  console.log(`选型建议检查通过：${files.length} 个组件文档页都写了「${HEADING}」`)
}
