/** 公共 Vue 导出与全量注册按组件目录生成，命令和类型导出保留原声明。 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { internalHosts } from './lib/registry.mjs'
const path = 'src/components/index.ts'
const names = readdirSync('src/components').filter(file => /^I.*\.vue$/.test(file) && !internalHosts.includes(file.slice(0, -4))).map(file => file.slice(0, -4)).sort()
let source = readFileSync(path, 'utf8')
const imports = names.map(name => `import ${name} from './${name}.vue'`).join('\n')
source = source.replace(/^import I\w+ from '\.\/I[^']+\.vue'\n/gm, '')
source = imports + '\n' + source
for (const pattern of [/export \{\n[\s\S]*?\n\}/, /const components = \{\n[\s\S]*?\n\}/]) {
  if (!pattern.test(source)) throw new Error('Vue 导出模板变化，请更新生成器')
  source = source.replace(pattern, `${pattern.source.startsWith('export') ? 'export' : 'const components ='} {\n  ${names.join(',\n  ')}\n}`)
}
writeFileSync(path, source)
console.log(`Vue 入口已生成：${names.length} 个组件`)
