/**
 * 按目录重新生成组件样式的汇总入口。
 * 手写清单必然会漏——移动端的 Cell / ActionSheet / Toast 就是这么漏掉的，
 * 数值检查全绿但界面是裸的，所以这一步必须自动化。
 */
import { readdirSync, writeFileSync } from 'node:fs'

const dir = 'packages/common/src/styles/components'
const files = readdirSync(dir).filter((f) => f.endsWith('.css')).sort()

/*
 * 顶层样式层也按目录收，不再手写。
 *
 * motion.css 就是这么漏掉的：文件写好了、注释写得很详细、构建全绿，
 * 但它从来没被任何入口 import 过——整个动效层是死代码，
 * 页面上一个进场、一次抬升、立方体的面全都不存在，而没有任何检查会报。
 * index.css 与 mobile.css 不在这里：前者是它自己，后者由移动端单独引。
 *
 * 排在组件之后，不是之前。
 *
 * 动效是工具层：.i-reveal 会加在卡片、面板这些已经有自己 transition 的元素上。
 * 排在组件之前的话，组件那条 transition 简写会把进场的时长、曲线与延迟一起重置掉——
 * 元素照样淡入，但用的是组件的参数，逐项延迟直接归零。
 * 现象是「动效生效了但不对」，比彻底不生效更难查。
 */
const layerDir = 'packages/common/src/styles'
const skipped = new Set(['index.css', 'mobile.css', 'tokens.css', 'tokens.responsive.css', 'tokens.mobile.css', 'base.css'])
const layers = readdirSync(layerDir).filter((f) => f.endsWith('.css') && !skipped.has(f)).sort()

const content = `/*
 * 组件样式总入口：各 Web 端引入这一个文件即可。
 * 由 scripts/build-styles-index.mjs 按目录自动生成——手写清单会漏掉新组件。
 */
@import './tokens.css';
/*
 * 自适应层：窄屏或触屏设备自动切到移动尺度（正文 16px、控件 44px）。
 * 只覆盖令牌，不覆盖组件样式，因此必须排在 tokens 之后、组件之前。
 */
@import './tokens.responsive.css';
@import './base.css';

${files.map((f) => `@import './components/${f}';`).join('\n')}

/* 工具层排在最后：它要能盖过组件自己的 transition，见 build-styles-index.mjs */
${layers.map((f) => `@import './${f}';`).join('\n')}
`
writeFileSync('packages/common/src/styles/index.css', content)
console.log(`汇总 ${files.length} 个组件样式 + ${layers.length} 个顶层样式层 → styles/index.css`)
