/**
 * 服务端渲染与运行环境兼容性。
 *
 * 组件库在 Node 里被 import 的那一刻，模块顶层就跑起来了。
 * 只要有一处顶层访问了 document / window，使用方的 SSR 构建会直接崩在
 * 「import 这一行」上——而在本仓库里完全看不出来：文档站是纯客户端的，
 * 所有检查也都在浏览器或带 DOM 桩的环境里跑。
 *
 * 三件事：
 *   ① 在没有任何 DOM 全局的 Node 里 import 各包，必须不抛；
 *   ② Vue 3 与 React 的服务端渲染真的渲得出结构和类名；
 *   ③ 服务端渲染的结果拿到浏览器里 hydrate，不许有不匹配告警。
 *
 * 用的是各包 dist 下的 npm 产物，不是源码——使用方拿到的是前者。
 */
import { createServer } from 'node:http'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { build as esbuild } from 'esbuild'

const root = process.cwd()
const distPath = (pkg) => resolve(root, `packages/${pkg}/dist/index.mjs`)
const dist = (pkg) => pathToFileURL(distPath(pkg)).href

/** 没有 DOM 的 Node 里 import：顶层碰 document 的话，这里就会抛 */
async function importWithoutDom() {
  // Node 22 自己就有 navigator，不能拿它当「环境不干净」的判据；
  // 真正会让 SSR 崩掉的是 window 与 document
  for (const global of ['window', 'document', 'localStorage']) {
    if (global in globalThis) throw new Error(`测试环境不干净：globalThis 上已经有 ${global}`)
  }
  const loaded = []
  for (const pkg of ['common', 'vue-next', 'vue', 'react', 'mobile-vue', 'mobile-react']) {
    const module = await import(dist(pkg))
    const names = Object.keys(module)
    if (!names.length) throw new Error(`${pkg} 的产物没有导出任何东西`)
    loaded.push(`${pkg}`)
  }
  return `无 DOM 环境下 import 通过：${loaded.join('、')}`
}

/*
 * 两个场景，对应两档 CSP：
 *   静态组件（按钮）必须在不带 unsafe-inline 的严格 CSP 下也完好；
 *   含动态几何的组件（提示条内部的图标按 px 定尺寸、图表按数据定形状）
 *   必然要写内联 style 属性，那一档只能要求 unsafe-inline。
 * 分开测才说得清「支持到哪一步」，混在一起就只能笼统写「支持 CSP」。
 */
const SCENES = {
  strict: `h(IButton, { variant: 'primary' }, () => '提交')`,
  inline: `h('div', [h(IButton, { variant: 'primary' }, () => '提交'), h(IAlert, { type: 'warning', title: '库存不足' })])`
}

async function renderVue(scene) {
  const { createSSRApp, h } = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  const { IButton, IAlert } = await import(dist('vue-next'))
  // eslint 之外没有别的求值方式：场景要在这里和浏览器里各跑一次，源码只能有一份
  const render = new Function('h', 'IButton', 'IAlert', `return () => ${SCENES[scene]}`)(h, IButton, IAlert)
  const app = createSSRApp({ render })
  const html = await renderToString(app)
  if (!/i-button/.test(html)) throw new Error(`Vue SSR 没渲染出按钮：${html.slice(0, 160)}`)
  if (!/提交/.test(html)) throw new Error('Vue SSR 渲染的按钮没有正文')
  if (scene === 'inline' && !/库存不足/.test(html)) throw new Error('Vue SSR 渲染的提示条没有标题')
  return { html, line: 'Vue 3 服务端渲染通过（结构与类名都在）' }
}

async function renderReact() {
  const { createElement } = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { Button } = await import(dist('react'))
  const html = renderToString(createElement(Button, { variant: 'primary' }, '提交'))
  if (!/i-button/.test(html)) throw new Error(`React SSR 没渲染出按钮：${html.slice(0, 160)}`)
  return { html, line: 'React 服务端渲染通过（结构与类名都在）' }
}

/**
 * 把服务端渲染的 HTML 拿到浏览器里 hydrate。
 *
 * 不匹配的典型来源是「服务端拿不到、客户端才有」的东西：随机 id、时间、
 * 媒体查询结果。Vue 会在控制台报 hydration mismatch，但只在开发构建里报，
 * 所以这里显式用未压缩的 vue 产物。
 */
async function hydrateVue(browser, ssrHtml, work, scene, styleInline) {
  const name = `hydrate-${scene}`
  const dir = join(work, name)
  mkdirSync(dir, { recursive: true })
  const bundle = join(dir, 'app.mjs')
  writeFileSync(join(dir, 'entry.mjs'), `
    import { createSSRApp, h } from 'vue'
    import { IButton, IAlert } from ${JSON.stringify(distPath('vue-next'))}
    const app = createSSRApp({ render: () => ${SCENES[scene]} })
    app.mount('#app', true)
  `)
  // 用开发版 vue：hydration 不匹配的告警只在开发构建里输出
  // 从仓库根目录解析依赖：消费项目会有自己的 node_modules，这里借本仓库的 vue 开发版
  await esbuild({
    entryPoints: [join(dir, 'entry.mjs')],
    bundle: true, format: 'esm', outfile: bundle,
    nodePaths: [resolve(root, 'node_modules')],
    // 明确指到 dist：workspace 的软链会把 @i-design/common 解析回源码，
    // 那样测的就不是使用方拿到的产物了
    alias: {
      // 子路径排在前面：否则会被拼成 index.mjs/illustrations
      '@i-design/common/illustrations': resolve(root, 'packages/common/dist/illustrations.mjs'),
      '@i-design/common': distPath('common')
    },
    define: {
      'process.env.NODE_ENV': '"development"',
      // esm-bundler 版的 vue 要求打包器注入这几个开关，不注入会刷一条告警，
      // 而 hydration 不匹配的细节正需要最后那个开着
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true'
    }
  })

  // 样式走外链而不是内联 <style>：这样这个页面能在严格 CSP 下加载，
  // 顺带把「组件会不会往页面里插内联样式」一起测了
  writeFileSync(join(dir, 'tokens.css'), readFileSync(resolve(root, 'packages/common/dist/styles/index.css'), 'utf8'))
  writeFileSync(join(dir, 'index.html'),
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><link rel="stylesheet" href="/tokens.css"></head>` +
    `<body><div id="app">${ssrHtml}</div><script type="module" src="/app.mjs"></script></body></html>`)

  const { server, port } = await serve(dir, styleInline)
  try {
    const page = await browser.newPage()
    const warnings = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (/hydrat/i.test(text)) warnings.push(text)
      // CSP 违规只会出现在控制台里，页面照常显示，肉眼完全看不出来
      if (/Content Security Policy/i.test(text)) warnings.push(`CSP 违规：${text}`)
    })
    page.on('pageerror', (e) => warnings.push(String(e)))
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(200)
    const background = await page.locator('.i-button').first()
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    await page.close()
    if (warnings.length) throw new Error(`hydrate 有告警：${warnings.join(' / ')}`)
    const policy = styleInline ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'（严格）"
    return `Vue 3 hydrate 通过：无不匹配告警，${policy} 下无违规（按钮底色 ${background}）`
  } finally {
    server.close()
  }
}

function serve(dir, styleInline = false) {
  const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css' }
  /*
   * 严格 CSP：不给 unsafe-inline。使用方的后台系统多半就是这么配的，
   * 而组件如果靠注入 <style> 或内联脚本工作，在那种环境里会静悄悄地坏掉。
   */
  const csp = `default-src 'self'; script-src 'self'; style-src 'self'${styleInline ? " 'unsafe-inline'" : ''}; img-src 'self' data:`
  const server = createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0])
    try {
      const file = join(dir, rel === '/' ? 'index.html' : rel)
      res.writeHead(200, {
        'content-type': types[file.slice(file.lastIndexOf('.'))] ?? 'text/plain',
        'content-security-policy': csp
      })
      res.end(readFileSync(file))
    } catch {
      // 头可能已经发出去了（读文件读到一半失败），这时只能直接断开
      if (!res.headersSent) res.writeHead(404)
      res.end('not found')
    }
  })
  return new Promise((ok) => server.listen(0, () => ok({ server, port: server.address().port })))
}

const work = mkdtempSync(join(tmpdir(), 'i-design-ssr-'))
const lines = []
let browser
try {
  lines.push(await importWithoutDom())
  const strict = await renderVue('strict')
  const inline = await renderVue('inline')
  lines.push(inline.line)
  lines.push((await renderReact()).line)
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  lines.push(await hydrateVue(browser, strict.html, work, 'strict', false))
  lines.push(await hydrateVue(browser, inline.html, work, 'inline', true))
} catch (error) {
  console.error('SSR 与兼容性检查失败：')
  console.error([error.message, error.stdout, error.stderr].filter(Boolean).join('\n').trim())
  await browser?.close()
  rmSync(work, { recursive: true, force: true })
  process.exit(1)
}
await browser.close()
rmSync(work, { recursive: true, force: true })
console.log(`SSR 与兼容性检查通过：\n  ${lines.join('\n  ')}`)
