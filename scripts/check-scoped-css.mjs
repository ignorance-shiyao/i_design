/**
 * 作用域样式的越界检查。
 *
 * 真实发生过：HomePage 里写 `:global([data-theme="dark"]) .hero-art { opacity: .16 }`，
 * 作用域编译把后代部分整个丢掉，只留下 `[data-theme=dark]{opacity:.16}`——
 * 于是暗色下整个 <html> 变成 16% 不透明度，全站文字与卡片一起发灰。
 * 构建没有报错，数值检查全绿，只有肉眼能发现。
 *
 * 所以这里按编译结果判定：<style scoped> 编译出的每条规则都必须带上
 * data-v 作用域属性；带不上的说明它已经逃出组件，作用到了别人身上。
 */
import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { compileStyle, parse } from 'vue/compiler-sfc'

const ROOT = process.cwd()

async function vueFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await vueFiles(full)))
    else if (entry.name.endsWith('.vue')) out.push(full)
  }
  return out
}

/** 取出一条 CSS 规则的选择器；@media 等 at-rule 递归进去看里面的规则 */
function selectorsOf(css) {
  const out = []
  // 去掉注释与字符串里的花括号干扰后，按「{ 前的那一段」取选择器
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const match of cleaned.matchAll(/([^{}]+)\{/g)) {
    const selector = match[1].trim()
    if (!selector || selector.startsWith('@') || selector.startsWith('from') || selector.startsWith('to'))
      continue
    if (/^\d+%$/.test(selector)) continue
    out.push(selector)
  }
  return out
}

const failures = []
for (const file of await vueFiles(join(ROOT, 'src'))) {
  const source = readFileSync(file, 'utf8')
  const { descriptor } = parse(source, { filename: file })
  for (const block of descriptor.styles) {
    if (!block.scoped) continue
    const id = `data-v-${Buffer.from(file).toString('hex').slice(0, 8)}`
    const { code } = compileStyle({
      source: block.content,
      filename: file,
      id,
      scoped: true
    })
    for (const selector of selectorsOf(code)) {
      // :deep()/::v-deep 产出的后代选择器把作用域属性留在祖先上，同样算带了
      if (selector.includes(id)) continue
      failures.push(`${relative(ROOT, file)}: 作用域样式逃逸 → ${selector}`)
    }
  }
}

if (failures.length) {
  console.error('作用域样式检查未通过：')
  for (const line of failures) console.error(`  ✗ ${line}`)
  console.error('\n祖先选择器不需要 :global()——作用域只会把属性加在末尾的选择器上。')
  process.exit(1)
}
console.log('作用域样式检查通过：<style scoped> 的规则都带着 data-v 属性')
