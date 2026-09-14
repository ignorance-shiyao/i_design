/**
 * 把 CLAUDE.md 里的视觉禁令变成会失败的检查。
 *
 * 这几条禁令此前只写在文档里，而「违反它算缺陷，即使构建通过、测试全绿」
 * 这句话本身说明：构建和测试都拦不住。写进文档的规则，下一个人（或下一次
 * 自动补全）照样会违反，而且没有任何一步会红。
 *
 * 查四条：
 *   ① 用加粗单边线表达状态或类型（几何三角形除外）；
 *   ② 元素填充用渐变（纹理、氛围底、遮罩、骨架屏扫光除外）；
 *   ③ 饱和语义底色上写死白字（应当用成对的 -solid / on- 令牌）；
 *   ④ 图标里混进 emoji 或路径数据以外的东西。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { cssBlocks, declarations, styleText } from './lib/css-blocks.mjs'

const STYLE_EXT = /\.(css|wxss|vue)$/
const SKIP_DIR = /(^|\/)(node_modules|dist|\.git)$/
// 令牌定义文件：渐变令牌本身定义在这里，定义不算使用
const TOKEN_FILES = /styles\/(tokens|tokens\.mobile|tokens\.responsive)\.css$/
// 语义色：压在它们上面的白字是本项目最常见的一类「字没印上去」
const SEMANTIC = /var\(--i-color-(brand|danger|success|warning|info)\)/
const WHITE = /^(#fff|#ffffff|white|rgb\(255[,\s]+255[,\s]+255\)|rgba?\(255[,\s]+255[,\s]+255[^)]*\))$/i

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      if (!SKIP_DIR.test(path)) walk(path, out)
    } else if (STYLE_EXT.test(entry.name)) out.push(path)
  }
  return out
}

/**
 * 渐变是不是「硬边拼色」：两段之间没有过渡，只是用一个位置把颜色切开。
 * 进度条轨道就是这么拼的——它读出来是两段纯色，不是渐变。
 */
function hardStops(gradient) {
  // 同一个位置出现两次＝上一段在这里结束、下一段在这里开始，中间没有过渡
  const positions = [...gradient.matchAll(/(\d+(?:\.\d+)?%|var\(--[\w-]+(?:\s*,[^)]*)?\))/g)].map((m) => m[1])
  return positions.some((p, i) => positions.indexOf(p) !== i)
}

/**
 * 半透明的氛围层不算元素填充：玻璃面、光晕、扫光描述的是背景质感，
 * 它们透出的是后面的东西，换主题色时也不会决定某个控件是什么颜色。
 * 判据是「每一处语义色都被 color-mix 兑进了 transparent」。
 */
function ambient(gradient) {
  const opaque = gradient.replace(/color-mix\(in srgb,[^()]*(?:\([^()]*\)[^()]*)*transparent\s*\)/g, '')
  return !SEMANTIC.test(opaque)
}

function checkFile(file, absolute, problems) {
  const text = styleText(absolute)
  const blocks = cssBlocks(text)

  // 几何三角形：宽或高为 0、靠透明边拼形状的那种，它的加粗边不是边线样式
  const triangles = blocks
    .filter((b) => {
      const decls = declarations(b.body)
      return decls.some((d) => /^border-(top|right|bottom|left)$/.test(d.prop) && /\btransparent\b/.test(d.value))
        && decls.some((d) => (d.prop === 'width' || d.prop === 'height') && d.value === '0')
    })
    .map((b) => b.selector)

  for (const block of blocks) {
    const decls = declarations(block.body)
    const where = `${file}:${block.line}（${block.selector}）`

    for (const { prop, value } of decls) {
      // ① 加粗单边线
      if (/^border-(top|right|bottom|left)$/.test(prop)) {
        const width = Number.parseFloat(value)
        const geometric = triangles.some((sel) => block.selector.startsWith(sel))
        if (width >= 2 && !/\btransparent\b/.test(value) && !geometric) {
          problems.push(`${where} 用 ${prop}: ${value} 的加粗边线表达状态；改成四边等宽的发丝线 + 图标淡底色块`)
        }
      }

      // ② 元素填充用渐变
      const fill = /^background(-color|-image)?$/.test(prop)
      if (value.includes('var(--i-gradient-')) {
        problems.push(`${where} 用了渐变令牌 ${value}；元素填充一律纯色`)
      } else if (fill && /(linear|conic)-gradient\(/.test(value) && SEMANTIC.test(value)
        && !hardStops(value) && !ambient(value)) {
        problems.push(`${where} 的 ${prop} 用语义色做渐变填充；元素填充一律纯色（纹理与氛围底不在此列）`)
      }

      // ③ 饱和语义底色上写死白字
      if (prop === 'color' && WHITE.test(value)) {
        const background = decls.find((d) => /^background(-color|-image)?$/.test(d.prop))
        if (background && (SEMANTIC.test(background.value) || /var\(--i-color-[\w-]+-solid\)/.test(background.value))) {
          problems.push(
            `${where} 在语义底色上写死了白字；底色与字色要成对取 --i-color-X-solid / --i-color-on-X`
          )
        }
      }
    }
  }
}

/** 图标只存路径数据：混进 emoji 或整段 SVG，会在各端各错一次 */
function checkIcons(root, problems) {
  const file = 'packages/common/src/icons/index.ts'
  const text = readFileSync(resolve(root, file), 'utf8')
  for (const [, key, value] of text.matchAll(/^\s+'?([\w-]+)'?:\s*'([^']*)'/gm)) {
    if (!/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/.test(value)) {
      problems.push(`${file} 的图标 ${key} 不是纯路径数据：${value.slice(0, 40)}`)
    }
  }
  // eslint 这类工具认不出 emoji；这里按码位判断，别处（wxss/vue）也一并查
  const emoji = /\p{Extended_Pictographic}/u
  for (const path of ['packages/common/src/icons/index.ts']) {
    if (emoji.test(readFileSync(resolve(root, path), 'utf8'))) problems.push(`${path} 里出现了 emoji，图标一律走 SVG 路径`)
  }
}

export function checkStyleRules(root = process.cwd()) {
  const problems = []
  const files = ['src', 'packages']
    .flatMap((dir) => walk(resolve(root, dir)))
    .map((f) => relative(root, f))
    .filter((f) => !TOKEN_FILES.test(f))
    .sort()

  for (const file of files) checkFile(file, resolve(root, file), problems)
  checkIcons(root, problems)

  if (problems.length) {
    const error = new Error(`样式禁令检查失败：\n  - ${problems.join('\n  - ')}`)
    error.problems = problems
    throw error
  }
  return `样式禁令检查通过：${files.length} 个样式文件，没有加粗状态边线、渐变填充与写死的白字`
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(checkStyleRules())
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
