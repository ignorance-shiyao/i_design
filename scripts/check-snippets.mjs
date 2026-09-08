/**
 * 校验文档站上的跨端代码片段，属性名确实存在于那一端的实现里。
 *
 * 「多端支持」这件事一旦靠手写片段来展示，就必然会和代码分叉：改了一个属性名，
 * 七份片段里只改得动手边那份。这里把每个片段用到的属性抽出来，
 * 与各端真实的 props / properties / 构造参数比对，对不上就让构建失败。
 */
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

execFileSync('node_modules/.bin/esbuild',
  ['src/data/snippets.ts', '--bundle', '--format=esm', '--outfile=/tmp/snippets.mjs'],
  { stdio: 'pipe' })
const { snippets } = await import('/tmp/snippets.mjs')

const problems = []

/** Vue 单文件组件：defineProps 泛型里的字段名 + defineEmits 的事件名 */
function vueApi(file) {
  const src = readFileSync(file, 'utf8')
  const props = new Set()
  const block = src.match(/defineProps<\{([\s\S]*?)\}>\(\)/)
  if (block) {
    for (const [, name] of block[1].matchAll(/^\s*(\w+)\??:/gm)) props.add(name)
  }
  const emits = new Set()
  for (const [, name] of src.matchAll(/['"]?([\w:]+)['"]?\s*:\s*\[/g)) emits.add(name)
  return { props, emits }
}

/** React：props 接口里的字段名；接口继承原生属性时，DOM 事件也算合法 */
function reactApi(file) {
  const src = readFileSync(file, 'utf8')
  const props = new Set()
  const header = src.match(/export interface \w+Props([^{]*)\{([\s\S]*?)\n\}/)
  if (header) {
    for (const [, name] of header[2].matchAll(/^\s*(\w+)\??:/gm)) props.add(name)
    // extends ButtonHTMLAttributes<...> 意味着 onClick、disabled 这些原生属性同样可用
    if (/HTMLAttributes/.test(header[1])) props.add('__dom__')
  }
  return props
}

/** 小程序：Component 的 properties 键名 */
function mpApi(file) {
  const src = readFileSync(file, 'utf8')
  const props = new Set()
  const block = src.match(/properties:\s*\{([\s\S]*?)\n\s*\},/)
  if (block) for (const [, name] of block[1].matchAll(/^\s*(\w+):\s*\{/gm)) props.add(name)
  return props
}

/** Flutter：指定类的构造函数具名参数（同一文件里常有多个类，必须按名匹配） */
function dartApi(file, className) {
  const src = readFileSync(file, 'utf8')
  const props = new Set()
  const block = src.match(new RegExp(`const ${className}\\(\\{([\\s\\S]*?)\\}\\);`))
  if (block) {
    for (const [, name] of block[1].matchAll(/(?:this\.|required this\.)(\w+)/g)) props.add(name)
  }
  return props
}

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

// 模板里这些不是组件属性，跳过
const htmlGlobals = new Set(['class', 'style', 'key', 'id', 'ref', 'slot'])

/** 从模板片段里取出某个标签上写的属性名 */
function attrsInTemplate(code, tagPattern) {
  const found = new Set()
  const tagRe = new RegExp(`<${tagPattern}\\b([^>]*)>`, 'g')
  for (const [, attrBlock] of code.matchAll(tagRe)) {
    for (const [, raw] of attrBlock.matchAll(/(?:^|\s)([@:a-zA-Z][\w:.-]*)=/g)) {
      let name = raw
      if (name.startsWith('@') || name.startsWith('bind') || name.startsWith('catch')) continue
      if (name.startsWith('v-')) continue
      if (name.startsWith(':')) name = name.slice(1)
      if (htmlGlobals.has(name)) continue
      found.add(camel(name))
    }
  }
  return found
}

function reactAttrs(code, component) {
  const found = new Set()
  for (const [, attrBlock] of code.matchAll(new RegExp(`<${component}\\b([\\s\\S]*?)/?>`, 'g'))) {
    for (const [, name] of attrBlock.matchAll(/(?:^|\s)(\w+)(?:=|\s*\n|\s*\/?>)/g)) {
      if (htmlGlobals.has(name)) continue
      found.add(name)
    }
  }
  return found
}

function dartAttrs(code, className) {
  const found = new Set()
  const block = code.match(new RegExp(`${className}\\(([\\s\\S]*)`))
  if (block) for (const [, name] of block[1].matchAll(/^\s*(\w+):/gm)) found.add(name)
  return found
}

/** 组件在各端的文件位置与标签名 */
const targets = {
  button: { vue: 'IButton', mp: 'button', react: 'Button', dart: 'i_button', dartClass: 'IButton' },
  select: { vue: 'ISelect', mp: 'select', react: 'Select', dart: 'i_select', dartClass: 'ISelect' },
  pagination: { vue: 'IPagination', mp: 'pagination', react: 'Pagination', dart: 'i_pagination', dartClass: 'IPagination' }
}

for (const [key, set] of Object.entries(snippets)) {
  const t = targets[key]
  if (!t) { problems.push(`${key}: 片段没有对应的核对目标，请在 targets 里补上`); continue }

  const check = (framework, used, available) => {
    for (const name of used) {
      // 继承了原生属性的 React 组件：onClick 这类事件不在接口里列，但确实可用
      if (available.has('__dom__') && /^(on[A-Z]|disabled$|type$|aria-)/.test(name)) continue
      if (!available.has(name)) {
        problems.push(`${key} / ${framework}: 片段用了 ${name}，但该端没有这个属性`)
      }
    }
  }

  if (set['vue-next']) {
    const { props } = vueApi(`src/components/${t.vue}.vue`)
    check('vue-next', attrsInTemplate(set['vue-next'], t.vue), props)
  }
  if (set.vue) {
    const { props } = vueApi(`packages/vue/src/components/${t.vue}.vue`)
    check('vue', attrsInTemplate(set.vue, t.vue), props)
  }
  if (set['mobile-vue']) {
    const { props } = vueApi(`src/components/${t.vue}.vue`)
    check('mobile-vue', attrsInTemplate(set['mobile-vue'], t.vue), props)
  }
  if (set.react) {
    check('react', reactAttrs(set.react, t.react), reactApi(`packages/react/src/components/${t.react}.tsx`))
  }
  if (set['mobile-react']) {
    check('mobile-react', reactAttrs(set['mobile-react'], t.react),
      reactApi(`packages/react/src/components/${t.react}.tsx`))
  }
  if (set.miniprogram) {
    check('miniprogram', attrsInTemplate(set.miniprogram, `i-${t.mp}`),
      mpApi(`packages/miniprogram/src/components/${t.mp}/index.js`))
  }
  if (set.flutter) {
    check('flutter', dartAttrs(set.flutter, t.dartClass),
      dartApi(`packages/flutter/lib/src/components/${t.dart}.dart`, t.dartClass))
  }
}

if (problems.length) {
  console.error('跨端代码片段校验未通过:')
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}
const count = Object.values(snippets).reduce((n, s) => n + Object.keys(s).length, 0)
console.log(`跨端代码片段校验通过：${Object.keys(snippets).length} 个组件，共 ${count} 份片段`)
