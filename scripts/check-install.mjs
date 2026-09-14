/**
 * 外部安装烟测：把包 pack 出来，装进仓库外的干净项目里，真的跑一遍。
 *
 * 这个仓库里的一切都被 tsconfig 的 paths 与 Vite 的 alias 兜着——
 * 源码跑得通、构建也绿，但那证明不了别人装下来能用。出过一次：
 * 所有包的 main 都指向 src/index.ts，仓库内一切正常，装到别人项目里
 * 拿到的是一个 import 不进去的 .ts 文件。
 *
 * 所以这里一律走 npm pack 出来的 tarball，消费项目建在系统临时目录下，
 * 不继承本仓库的任何配置。四件事逐项过：
 *   ① import（ESM）与 require（CJS）都能拿到组件；
 *   ② 类型声明能被 tsc 解析，写错属性会报错——类型提示不是摆设；
 *   ③ 消费项目自己的打包器能把它打出来；
 *   ④ 打出来的页面在浏览器里真的渲染，且样式真的生效（量背景色，不是看截图）。
 */
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from 'playwright'

const root = process.cwd()
const keep = process.argv.includes('--keep')
const run = (cmd, args, cwd, env) =>
  execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8', env: { ...process.env, ...env } })

/** 亮色主题下主按钮的底色：样式没装进去的话，这里会是透明 */
const BRAND_SOLID = 'rgb(83, 112, 210)'

const PACKAGES = ['common', 'vue-next', 'vue', 'mobile-vue', 'react', 'mobile-react']

function packAll(work) {
  const dir = join(work, 'tarballs')
  mkdirSync(dir, { recursive: true })
  const map = {}
  for (const name of PACKAGES) {
    const out = run('npm', ['pack', '--pack-destination', dir], join(root, 'packages', name)).trim()
    const file = out.split('\n').pop().trim()
    map[`@i-design/${name}`] = join(dir, file)
  }
  return map
}

/** 静态目录起一个最小服务：file:// 下模块脚本会被当成跨源，加载不了 */
function serve(dir) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp' }
  const server = createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0])
    const file = join(dir, rel === '/' ? 'index.html' : rel)
    try {
      const body = readFileSync(file)
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  return new Promise((ok) => server.listen(0, () => ok({ server, port: server.address().port })))
}

const CONSUMERS = [
  {
    name: 'vue3',
    deps: { vue: '^3.5.13', vite: '^6.0.11', '@vitejs/plugin-vue': '^5.2.1', typescript: '^5.7.3', 'vue-tsc': '^2.2.0' },
    uses: ['@i-design/common', '@i-design/vue-next'],
    typecheck: ['npx', ['vue-tsc', '--noEmit']],
    files: {
      'vite.config.ts': `import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\nexport default defineConfig({ plugins: [vue()] })\n`,
      'src/App.vue': `<script setup lang="ts">\nimport { IButton } from '@i-design/vue-next'\n</script>\n<template><IButton variant="primary" data-probe>装下来的按钮</IButton></template>\n`,
      'src/main.ts': `import { createApp } from 'vue'\nimport '@i-design/common/styles/index.css'\nimport App from './App.vue'\ncreateApp(App).mount('#app')\n`
    }
  },
  {
    name: 'react',
    deps: { react: '^19.2.8', 'react-dom': '^19.2.8', vite: '^6.0.11', '@vitejs/plugin-react': '^4.7.0', typescript: '^5.7.3', '@types/react': '^19.2.18', '@types/react-dom': '^19.2.7' },
    uses: ['@i-design/common', '@i-design/react'],
    typecheck: ['npx', ['tsc', '--noEmit']],
    files: {
      'vite.config.ts': `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n`,
      'src/main.tsx': `import { createRoot } from 'react-dom/client'\nimport { Button } from '@i-design/react'\nimport '@i-design/common/styles/index.css'\ncreateRoot(document.getElementById('app')!).render(<Button variant="primary" data-probe>装下来的按钮</Button>)\n`
    }
  },
  {
    name: 'vue2',
    deps: { vue: '^2.7.16', vite: '^6.0.11', '@vitejs/plugin-vue2': '^2.3.4', typescript: '^5.7.3' },
    uses: ['@i-design/common', '@i-design/vue'],
    typecheck: ['npx', ['tsc', '--noEmit']],
    files: {
      'vite.config.ts': `import { defineConfig } from 'vite'\nimport vue2 from '@vitejs/plugin-vue2'\nexport default defineConfig({ plugins: [vue2()] })\n`,
      'src/main.ts': `import Vue from 'vue'\nimport { IButton } from '@i-design/vue'\nimport '@i-design/common/styles/index.css'\nnew Vue({\n  render: (h) => h(IButton, { props: { variant: 'primary' }, attrs: { 'data-probe': '' } }, ['装下来的按钮'])\n}).$mount('#app')\n`
    }
  },
  {
    name: 'mobile-vue',
    deps: { vue: '^3.5.13', vite: '^6.0.11', '@vitejs/plugin-vue': '^5.2.1', typescript: '^5.7.3', 'vue-tsc': '^2.2.0' },
    uses: ['@i-design/common', '@i-design/vue-next', '@i-design/mobile-vue'],
    typecheck: ['npx', ['vue-tsc', '--noEmit']],
    files: {
      'vite.config.ts': `import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\nexport default defineConfig({ plugins: [vue()] })\n`,
      'src/App.vue': `<script setup lang="ts">\nimport { IButton } from '@i-design/vue-next'\nimport { ICell } from '@i-design/mobile-vue'\n</script>\n<template>\n  <div>\n    <ICell title="移动端单元格" />\n    <IButton variant="primary" data-probe>装下来的按钮</IButton>\n  </div>\n</template>\n`,
      'src/main.ts': `import { createApp } from 'vue'\nimport '@i-design/common/styles/index.css'\nimport '@i-design/common/styles/mobile.css'\nimport App from './App.vue'\ncreateApp(App).mount('#app')\n`
    }
  }
]

const INDEX_HTML = (entry) =>
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>consumer</title></head>` +
  `<body><div id="app"></div><script type="module" src="/${entry}"></script></body></html>\n`

const TSCONFIG = {
  compilerOptions: {
    target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', strict: true,
    jsx: 'react-jsx', noEmit: true, skipLibCheck: false, types: []
  },
  include: ['src']
}

async function checkConsumer(spec, work, tarballs, browser) {
  const dir = join(work, spec.name)
  mkdirSync(join(dir, 'src'), { recursive: true })
  const deps = { ...spec.deps }
  for (const name of spec.uses) deps[name] = `file:${tarballs[name]}`

  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: `consumer-${spec.name}`, private: true, version: '0.0.0', type: 'module', dependencies: deps
  }, null, 2))
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(TSCONFIG, null, 2))
  for (const [file, body] of Object.entries(spec.files)) {
    mkdirSync(join(dir, file, '..'), { recursive: true })
    writeFileSync(join(dir, file), body)
  }
  const entry = Object.keys(spec.files).find((f) => /main\.(ts|tsx)$/.test(f))
  writeFileSync(join(dir, 'index.html'), INDEX_HTML(entry))

  // Vue 2.7 与 Vue 3 在同一棵依赖树里共存是刻意的，消费项目同样需要
  run('npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps'], dir)

  const [typeCmd, typeArgs] = spec.typecheck
  run(typeCmd, typeArgs, dir)
  run('npx', ['vite', 'build', '--logLevel', 'error'], dir)

  const { server, port } = await serve(join(dir, 'dist'))
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
    const probe = page.locator('[data-probe]')
    const text = (await probe.textContent())?.trim()
    if (text !== '装下来的按钮') throw new Error(`${spec.name}: 页面没渲染出组件，取到的是 ${JSON.stringify(text)}`)
    const background = await probe.evaluate((el) => getComputedStyle(el).backgroundColor)
    if (background !== BRAND_SOLID) {
      throw new Error(`${spec.name}: 样式没生效，主按钮底色是 ${background}，应当是 ${BRAND_SOLID}`)
    }
    if (errors.length) throw new Error(`${spec.name}: 页面抛错 ${errors.join(' / ')}`)
    await page.close()
    return `${spec.name}：类型、打包、渲染与样式（${background}）均通过`
  } finally {
    server.close()
  }
}

/** CJS 侧：require 拿到的必须是同一批组件，而不是一个空对象 */
function checkRequire(work, tarballs) {
  const dir = join(work, 'cjs')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: 'consumer-cjs', private: true, version: '0.0.0',
    dependencies: { vue: '^3.5.13', '@i-design/common': `file:${tarballs['@i-design/common']}`,
      '@i-design/vue-next': `file:${tarballs['@i-design/vue-next']}` }
  }, null, 2))
  run('npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps'], dir)
  writeFileSync(join(dir, 'probe.cjs'), `
    const common = require('@i-design/common')
    const vue = require('@i-design/vue-next')
    const assert = require('node:assert/strict')
    assert.equal(typeof common.icons, 'object', 'common 的图标数据没 require 到')
    assert.ok(vue.IButton, 'vue-next 的 IButton 没 require 到')
    console.log('ok')
  `)
  const out = run('node', ['probe.cjs'], dir).trim()
  if (out !== 'ok') throw new Error(`require 探针输出异常：${out}`)
  return 'require（CJS）：common 与 vue-next 都拿得到'
}

const work = mkdtempSync(join(tmpdir(), 'i-design-install-'))
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const lines = []
try {
  const tarballs = packAll(work)
  lines.push(`已 pack ${Object.keys(tarballs).length} 个包`)
  lines.push(checkRequire(work, tarballs))
  for (const spec of CONSUMERS) lines.push(await checkConsumer(spec, work, tarballs, browser))
} catch (error) {
  await browser.close()
  console.error('外部安装烟测失败：')
  // 子进程失败时 message 只有一句 Command failed，真正的原因在两个流里
  console.error([error.message, error.stdout, error.stderr].filter(Boolean).join('\n').trim())
  if (keep) console.error(`消费项目保留在 ${work}`)
  else rmSync(work, { recursive: true, force: true })
  process.exit(1)
}
await browser.close()
if (!keep) rmSync(work, { recursive: true, force: true })
console.log(`外部安装烟测通过：\n  ${lines.join('\n  ')}`)
