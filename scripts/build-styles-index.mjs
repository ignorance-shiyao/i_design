/**
 * 按目录重新生成组件样式的汇总入口。
 * 手写清单必然会漏——移动端的 Cell / ActionSheet / Toast 就是这么漏掉的，
 * 数值检查全绿但界面是裸的，所以这一步必须自动化。
 */
import { readdirSync, writeFileSync } from 'node:fs'

const dir = 'packages/common/src/styles/components'
const files = readdirSync(dir).filter((f) => f.endsWith('.css')).sort()

const content = `/*
 * 组件样式总入口：各 Web 端引入这一个文件即可。
 * 由 scripts/build-styles-index.mjs 按目录自动生成——手写清单会漏掉新组件。
 */
@import './tokens.css';
@import './base.css';

${files.map((f) => `@import './components/${f}';`).join('\n')}
`
writeFileSync('packages/common/src/styles/index.css', content)
console.log(`汇总 ${files.length} 个组件样式 → styles/index.css`)
