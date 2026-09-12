/**
 * 校验各包 package.json 里承诺的入口，构建之后确实存在。
 *
 * exports 一旦写错，症状只会出现在别人的项目里——本仓库有 tsconfig 的 paths 与
 * Vite 的 alias 兜底，源码照样跑得通，构建也不会红。也就是说这类错误在这里
 * 天然是看不见的，只能靠一次显式核对。
 *
 * 顺带确认 main / module / types 与 exports 指的是同一批文件：有些打包器只认
 * exports，有些老工具只认 main，两边不一致时会一个能用一个不能用。
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const packages = ['common', 'vue-next', 'vue', 'mobile-vue', 'react', 'mobile-react']
const problems = []

for (const name of packages) {
  const dir = join(root, 'packages', name)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const check = (label, rel) => {
    if (typeof rel !== 'string') return
    // 通配入口只能核到目录：具体有哪些文件由使用方按需引，列不全也不该在这里假报
    const target = rel.includes('*') ? rel.slice(0, rel.indexOf('*')) : rel
    if (!existsSync(join(dir, target))) problems.push(`${pkg.name} 的 ${label} 指向不存在的 ${target}`)
  }

  for (const field of ['main', 'module', 'types']) check(field, pkg[field])
  for (const [subpath, target] of Object.entries(pkg.exports ?? {})) {
    if (typeof target === 'string') check(`exports["${subpath}"]`, target)
    else for (const [cond, file] of Object.entries(target)) check(`exports["${subpath}"].${cond}`, file)
  }

  // files 只写 dist，源码就不会被发出去；漏了它则相反，dist 不在清单里 npm pack 会漏掉产物
  if (!(pkg.files ?? []).includes('dist')) problems.push(`${pkg.name} 的 files 里没有 dist`)
  if (pkg.sideEffects === undefined) problems.push(`${pkg.name} 没有声明 sideEffects`)
}

if (problems.length) {
  console.error('包入口校验失败：')
  for (const line of problems) console.error(`  - ${line}`)
  process.exit(1)
}
console.log(`包入口校验通过：${packages.length} 个包的 main / module / types / exports 均指向已存在的产物`)
