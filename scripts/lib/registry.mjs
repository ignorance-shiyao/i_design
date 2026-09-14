/**
 * 能力注册表：把「这个组件到底有什么」从磁盘上一次性读出来。
 *
 * 在这之前，同一个问题有四个各自为政的答案——覆盖矩阵只看文件在不在、
 * 框架统计只数导出名、组件目录靠 componentStatus 猜、文档入口写在路由里。
 * 问「IUpload 能用吗」要翻四个地方，而四处对不上时没有任何检查会红。
 *
 * 这里只做一件事：按目录发现，合成一份带来源路径的记录。
 * 所有字段都必须能追到某个文件；凡是需要人填的字段，一律不收。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { exportedComponents } from './exported-components.mjs'
import { parseVueProps } from './parse-props.mjs'

/** IChatToolCall → chat-tool-call */
export const kebab = (name) =>
  name.replace(/^I/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

// 小程序把部分组件合并实现，目录名与 Vue 端对不上，这里显式对应。
// 这份对应关系与 build-component-matrix.mjs 共用，写两份必然漂移。
export const mpAlias = {
  'checkbox-group': 'checkbox',
  'radio-group': 'radio',
  'form-item': 'form-item',
  'chat-tool-call': 'chat-tool',
  loading: 'loading',
  'avatar-group': 'avatar-group',
  // 通知层在小程序端就叫 notification，Web 端多了 Layer 后缀表示它是挂载点
  'notification-layer': 'notification'
}

// message() / confirm() 的内部宿主：页面里不直接用，不作为对外组件统计
export const internalHosts = ['IMessageList', 'IConfirmLayer']

/*
 * 命令式 API 的挂载点：notification() 自己把它挂到 body 上，
 * 文档页里不会出现 <INotificationLayer>，因此不要求它有演示。
 * 它与 internalHosts 的区别是：使用方要在应用根部放一个，所以仍然算对外组件。
 */
export const imperativeHosts = ['INotificationLayer']

/**
 * Flutter 端按「类是否存在」判断而不是按文件名：
 * i_checkbox.dart 里同时定义了 ICheckbox 与 ICheckboxGroup。
 */
function dartClasses(root) {
  const dir = resolve(root, 'packages/flutter/lib/src/components')
  const found = new Map()
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.dart')) continue
    const src = readFileSync(resolve(dir, file), 'utf8')
    for (const [, name] of src.matchAll(/^class (I[A-Za-z0-9]+)(?:<[^>]*>)?\s*(?:extends|\{)/gm)) {
      if (!found.has(name)) found.set(name, `packages/flutter/lib/src/components/${file}`)
    }
  }
  return found
}

/** Web 端组件名列表（不含内部宿主与下划线开头的私有件） */
export function componentNames(root = process.cwd()) {
  return readdirSync(resolve(root, 'src/components'))
    .filter((f) => f.endsWith('.vue') && !f.startsWith('_'))
    .map((f) => f.replace('.vue', ''))
    .filter((name) => !internalHosts.includes(name))
    .sort()
}

/** 每个组件在各端的源码路径；没有该端实现时为 null */
export function endSources(root = process.cwd()) {
  const dart = dartClasses(root)
  const here = (p) => (existsSync(resolve(root, p)) ? p : null)
  const rows = new Map()
  for (const name of componentNames(root)) {
    const bare = name.replace(/^I/, '')
    const mpName = mpAlias[kebab(name)] ?? kebab(name)
    rows.set(name, {
      'vue-next': `src/components/${name}.vue`,
      vue: here(`packages/vue/src/components/${name}.vue`),
      // React 把 Checkbox 与 CheckboxGroup 之类放在同一个文件里
      react:
        here(`packages/react/src/components/${bare}.tsx`) ??
        here(`packages/react/src/components/${bare.replace(/Group$/, '')}.tsx`) ??
        (['Row', 'Col'].includes(bare) ? here('packages/react/src/components/Grid.tsx') : null),
      miniprogram: here(`packages/miniprogram/src/components/${mpName}/index.wxml`)
        && `packages/miniprogram/src/components/${mpName}`,
      flutter: dart.get(name) ?? null
    })
  }
  return rows
}

/** 各端对外导出的组件名。小程序没有「导出」这回事，用 usingComponents 的目录代替。 */
function endExports(root) {
  const read = (p) => (existsSync(resolve(root, p)) ? exportedComponents(resolve(root, p)) : new Set())
  const flutterBarrel = resolve(root, 'packages/flutter/lib/i_design.dart')
  const barrel = existsSync(flutterBarrel) ? readFileSync(flutterBarrel, 'utf8') : ''
  return {
    'vue-next': read('packages/vue-next/src/index.ts'),
    vue: read('packages/vue/src/index.ts'),
    react: read('packages/react/src/index.ts'),
    site: read('src/components/index.ts'),
    flutterFiles: new Set(
      [...barrel.matchAll(/export '(src\/components\/[^']+)'/g)].map((m) => `packages/flutter/lib/${m[1]}`)
    )
  }
}

/**
 * 文档路由：`/components/<slug>` 下的页面里，
 * 出现 `<Playground name="IXxx"` 或 slug 与组件名一致的，算这个组件的文档入口。
 *
 * 不用「页面 import 了谁」——表单页 import 了输入框，但那是表单的例子，
 * 照那样算，IInput 的文档入口会指到 /components/form 去。
 */
function docPages(root) {
  const router = readFileSync(resolve(root, 'src/router/index.ts'), 'utf8')
  const primary = new Map() // 组件名 → 主文档入口
  const mentions = new Map() // 组件名 → 出现过它的所有路由
  const pascal = (slug) => `I${slug.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}`

  for (const [, slug, page] of router.matchAll(
    /path:\s*'([a-z0-9-]+)',\s*component:\s*\(\)\s*=>\s*import\('@\/pages\/components\/([A-Za-z0-9]+\.vue)'\)/g
  )) {
    const file = `src/pages/components/${page}`
    if (!existsSync(resolve(root, file))) continue
    const src = readFileSync(resolve(root, file), 'utf8')
    const entry = { route: `/components/${slug}`, page: file, demos: [...src.matchAll(/<DemoBlock\b/g)].length }

    // 主入口：playground 的主角，或 slug 与组件名对得上的那个
    for (const [, name] of src.matchAll(/<Playground[^>]*\bname="(I[A-Za-z0-9]+)"/g)) primary.set(name, entry)
    if (!primary.has(pascal(slug))) primary.set(pascal(slug), entry)

    // 出场：模板里真的用到了。IAvatarGroup 没有自己的页面，但头像页演示了它
    for (const [, name] of src.matchAll(/<(I[A-Za-z0-9]+)[\s/>]/g)) {
      if (!mentions.has(name)) mentions.set(name, [])
      if (!mentions.get(name).includes(entry.route)) mentions.get(name).push(entry.route)
    }
  }
  return { primary, mentions }
}

/**
 * 状态集：属性里的字面量联合。
 *
 * 这是「这个组件有几种样子」唯一不靠人填的来源——variant / size / status
 * 这类枚举决定了 Patterns Lab 要生成多少个演示，也决定 H01 的覆盖口径。
 */
function stateSet(root, file) {
  const { props } = parseVueProps(resolve(root, file))
  const states = {}
  for (const p of props ?? []) {
    const literals = [...p.type.matchAll(/'([^']+)'/g)].map((m) => m[1])
    if (literals.length > 1) states[p.name] = literals
  }
  return states
}

const ENDS = ['vue-next', 'vue', 'react', 'miniprogram', 'flutter']

export function buildRegistry(root = process.cwd()) {
  const sources = endSources(root)
  const exports_ = endExports(root)
  const { primary, mentions } = docPages(root)

  return [...sources].map(([name, src]) => {
    const ends = Object.fromEntries(ENDS.map((end) => [end, Boolean(src[end])]))
    const consumable = {
      'vue-next': exports_['vue-next'].has(name),
      vue: exports_.vue.has(name),
      react: Boolean(src.react) && exports_.react.has(name.replace(/^I/, '')),
      // 小程序靠目录被 scaffold 生成，四件套齐全即可用，没有导出清单
      miniprogram: Boolean(src.miniprogram),
      flutter: Boolean(src.flutter) && exports_.flutterFiles.has(src.flutter)
    }
    const doc = primary.get(name) ?? null
    return {
      name,
      sources: Object.fromEntries(ENDS.map((end) => [end, src[end]])),
      ends,
      consumable,
      // 齐全＝五端都有源码且都拿得到；缺一端就是 partial，缺文档入口另算
      maturity: ENDS.every((end) => ends[end] && consumable[end]) ? 'stable' : 'partial',
      doc: doc ? { route: doc.route, page: doc.page, demos: doc.demos } : null,
      // 没有独立文档页的组件，至少要在某一页的演示里真的出现过
      demoRoutes: mentions.get(name) ?? [],
      states: stateSet(root, src['vue-next'])
    }
  })
}

export const registryFile = 'src/data/capabilityRegistry.ts'

export function registrySource(root = process.cwd()) {
  const rows = buildRegistry(root)
  return `/**
 * 由 scripts/build-capability-registry.mjs 按源码目录生成，请勿手改。
 * 每个字段都追得到具体文件；口径见 scripts/lib/registry.mjs。
 */
export interface CapabilityRow {
  /** 组件名，如 IButton */
  name: string
  /** 各端源码路径，没有该端实现时为 null */
  sources: Record<string, string | null>
  /** 该端是否有源码 */
  ends: Record<string, boolean>
  /** 使用方是否真的拿得到：有源码但没从入口导出，等于没有 */
  consumable: Record<string, boolean>
  maturity: 'stable' | 'partial'
  /** 主文档入口与该页演示数量；没有独立文档页时为 null */
  doc: { route: string; page: string; demos: number } | null
  /** 模板里真的用到了这个组件的文档路由 */
  demoRoutes: string[]
  /** 属性里的字面量联合，即「这个组件有几种样子」 */
  states: Record<string, string[]>
}

export const capabilityRegistry: readonly CapabilityRow[] = ${JSON.stringify(rows, null, 2)}
`
}
