/**
 * 发布前的静态核对。
 *
 * 这些错误的共同点是：在本仓库里一切正常，发出去之后才在使用方那里炸。
 *   - 各包版本号不一致 → 使用方装到一半互相不兼容的两个包；
 *   - 包与包之间的依赖写成 ^ → 同一次安装里可能混进两个 common；
 *   - CHANGELOG 里没有当前版本 → 发了什么没人说得清；
 *   - 弃用条目没写移除版本 → 「先标着以后再说」，然后一直标着。
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { publishableDirs } from './lib/licenses.mjs'

export function checkRelease(root = process.cwd()) {
  const rootPkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
  const version = rootPkg.version
  const dirs = publishableDirs(root)

  for (const dir of dirs) {
    const manifest = resolve(root, dir, 'package.json')
    if (existsSync(manifest)) {
      const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
      assert.equal(pkg.version, version, `${dir} 的版本是 ${pkg.version}，与仓库版本 ${version} 不一致`)
      for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
        if (!name.startsWith('@i-design/')) continue
        assert.equal(range, version,
          `${pkg.name} 依赖 ${name}@${range}：仓库内的包之间要写死同一个版本，` +
          '写成范围会让一次安装里混进两份 common')
      }
    }
    const pubspec = resolve(root, dir, 'pubspec.yaml')
    if (existsSync(pubspec)) {
      const hit = /^version:\s*(.+)$/m.exec(readFileSync(pubspec, 'utf8'))
      assert.ok(hit, `${dir}/pubspec.yaml 没有 version`)
      assert.equal(hit[1].trim(), version, `${dir}/pubspec.yaml 的版本与仓库版本 ${version} 不一致`)
    }
  }

  const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8')
  assert.ok(
    changelog.includes(`## [${version}]`) || changelog.includes('## [未发布]'),
    `CHANGELOG 里既没有 ${version} 也没有「未发布」一节：发了什么没人说得清`
  )

  // 弃用条目必须写明计划在哪个版本移除
  const deprecated = changelog.split('\n')
    .filter((line) => /^[-*] /.test(line) && /@deprecated|弃用/.test(line))
  for (const line of deprecated) {
    assert.ok(/在\s*\d+\.\d+(\.\d+)?\s*(中)?移除|移除于\s*\d+\.\d+/.test(line),
      `弃用条目没写移除版本：${line.trim()}`)
  }

  assert.ok(existsSync(resolve(root, 'VERSIONING.md')), '缺少版本与兼容策略文档')
  return `发布核对通过：${dirs.length} 个发布目录版本一致（${version}），CHANGELOG 与弃用条目齐全`
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(checkRelease())
}
