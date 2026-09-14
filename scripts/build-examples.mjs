/**
 * 逐个构建示例应用（astra.md 的 G02）。
 *
 * 一个应用一个构建：某个应用坏了不该把其它几个一起拖下水，
 * 也才谈得上「每个应用能独立启动 / 子路径构建」。
 * 产物统一落到 dist-examples/<id>/，门户与应用之间按相对路径互链。
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { build } from 'esbuild'

async function apps(root = process.cwd()) {
  const bundled = await build({
    stdin: { contents: `export * from './examples/shell/src/apps.ts'`, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node'
  })
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
  )
  return mod.exampleApps
}

const list = await apps()
// 门户自己不在登记表里：登记表登记的是「示例应用」，门户是它们的目录
const targets = [{ id: 'portal', status: 'ready' }, ...list.filter((a) => a.status === 'ready')]

for (const app of targets) {
  const config = `examples/${app.id}/vite.config.ts`
  if (!existsSync(config)) {
    console.error(`示例 ${app.id} 登记为 ready，却没有 ${config}`)
    process.exit(1)
  }
  execFileSync(
    'npx',
    ['vite', 'build', '--config', config, '--outDir', `../../dist-examples/${app.id}`, '--emptyOutDir', `examples/${app.id}`],
    { stdio: 'inherit' }
  )
}

console.log(`示例构建完成：${targets.map((a) => a.id).join('、')} → dist-examples/`)
