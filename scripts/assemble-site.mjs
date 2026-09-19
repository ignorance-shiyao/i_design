/** 将已独立构建的示例装进文档站；应用目录从登记表派生，不维护第二份清单。 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { loadApps } from './check-examples.mjs'

export async function assembleSite(root = process.cwd()) {
  const { exampleApps } = await loadApps(root)
  const ids = ['portal', ...exampleApps.filter(app => app.status === 'ready').map(app => app.id)]
  assert.ok(existsSync(join(root, 'dist/index.html')), '先构建文档站：缺少 dist/index.html')
  // 完整性确认后再清理目标，失败时保留上一份组装结果。
  for (const id of ids) {
    assert.match(id, /^[a-z0-9-]+$/, '应用目录标识无效')
    assert.ok(existsSync(join(root, 'dist-examples', id, 'index.html')), `示例未构建：${id}/index.html`)
  }
  const target = join(root, 'dist/examples')
  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  for (const id of ids) cpSync(join(root, 'dist-examples', id), join(target, id), { recursive: true })
  return ids
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log('站点组装完成：', await assembleSite())
}
