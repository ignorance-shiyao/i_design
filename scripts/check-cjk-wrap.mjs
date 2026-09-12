/**
 * 模板里的中文换行不能变成一个空格。
 *
 * Vue（以及 JSX、WXML）会把文本里的换行压成一个空格。英文里这正是要的——
 * 单词之间本来就有空格；中文里不是：源码写成
 *
 *     <p>
 *       用户还在填的时候不打断，
 *       离开字段时才给出反馈。
 *     </p>
 *
 * 渲染出来是「不打断， 离开字段」，中间多一个空格。它不只是看着松——
 * 那个空格真的在 DOM 文本里，复制粘贴带着它，读屏也会读出停顿。
 * 一页上有三五处，整页的中文就显得是机器排的。
 *
 * 所以规则是：**中文与中文之间不换行**。要换行就在这一句写完之后换，
 * 或者干脆让这一行长一点——源码里的一行长，胜过页面上多一个空格。
 *
 * 跑 `--fix` 自动把这类换行接回去。检查放进 check:parity：
 * 这种问题不会让构建失败，靠眼睛盯着迟早会漏。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { globSync } from 'node:fs'

/** 中日韩文字与全角标点，外加破折号与省略号——它们在中文里同样不该跟空格连用 */
const CJK = '[\\u3000-\\u303f\\u3400-\\u4dbf\\u4e00-\\u9fff\\uff00-\\uffef\\u2014\\u2026]'
const BREAK = new RegExp(`(${CJK})[ \\t]*\\r?\\n[ \\t]*(${CJK})`, 'g')

/**
 * 把不该动的区域涂成同长度的空白。
 *
 * 代码示例（`code` 属性）与 `<pre>` / `<code>` 里的换行是内容本身，接起来就把
 * 示例改错了。注释不渲染，接了只会把一段解释挤成一行长文——那是反着来的。
 * 涂成等长空白而不是删掉，是为了让下标仍然对得上原文。
 */
function mask(text) {
  const blanks = (s) => s.replace(/[^\n]/g, ' ')
  return text
    .replace(/<!--[\s\S]*?-->/g, blanks)
    .replace(/\bcode=(["'])[\s\S]*?\1/g, blanks)
    .replace(/<(pre|code)\b[\s\S]*?<\/\1>/g, blanks)
}

function templateOf(source) {
  const start = source.indexOf('<template>')
  const end = source.lastIndexOf('</template>')
  if (start < 0 || end < 0) return null
  return { start: start + '<template>'.length, end }
}

export function findBreaks(source) {
  const range = templateOf(source)
  if (!range) return []
  const body = source.slice(range.start, range.end)
  const masked = mask(body)
  const hits = []
  for (const m of masked.matchAll(BREAK)) {
    const line = source.slice(0, range.start + m.index).split('\n').length
    hits.push({
      index: range.start + m.index,
      line,
      text: body.slice(m.index, m.index + m[0].length)
    })
  }
  return hits
}

export function fixSource(source) {
  const hits = findBreaks(source)
  if (!hits.length) return source
  let out = source
  // 从后往前改，前面的下标才不会被动过的那几处顶偏
  for (const hit of [...hits].reverse()) {
    const slice = out.slice(hit.index, hit.index + hit.text.length)
    out =
      out.slice(0, hit.index) +
      slice.replace(/[ \t]*\r?\n[ \t]*/, '') +
      out.slice(hit.index + hit.text.length)
  }
  // 三行连着的中文一次接不完：接到不再有为止
  return findBreaks(out).length ? fixSource(out) : out
}

if (process.argv[1] && process.argv[1].endsWith('check-cjk-wrap.mjs')) {
  const fix = process.argv.includes('--fix')
  const files = globSync('src/**/*.vue')
  let total = 0
  const offenders = []

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const hits = findBreaks(source)
    if (!hits.length) continue
    total += hits.length
    if (fix) {
      writeFileSync(file, fixSource(source))
    } else {
      const more = hits.length > 1 ? ` 等 ${hits.length} 处` : ''
      offenders.push(`${file}:${hits[0].line} — ${JSON.stringify(hits[0].text)}${more}`)
    }
  }

  if (fix) {
    console.log(`中文换行已接回：${total} 处`)
  } else if (total) {
    console.error(
      `中文之间换行会在页面上多出一个空格（${total} 处）：\n  ${offenders.join('\n  ')}\n` +
        '跑 node scripts/check-cjk-wrap.mjs --fix 自动接回。'
    )
    process.exit(1)
  } else {
    console.log(`中文换行检查通过：${files.length} 个模板`)
  }
}
