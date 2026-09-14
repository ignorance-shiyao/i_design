/**
 * 许可证与来源清单的检查。
 *
 * 三件事，缺一件分发出去的包就是一句空声明：
 * ① 每个发布目录里真的有许可证文件，且与根目录逐字节一致；
 * ② package.json 的 license 字段与 files 清单确实会把它发出去；
 * ③ 每个二进制素材都有来源记录，清单本身是新鲜的。
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  binaryAssets, licenseFile, packageLicensePaths, publishableDirs,
  readProvenance, runtimeDependencies, installedLicense, thirdPartyFile, thirdPartySource
} from './lib/licenses.mjs'

export function checkLicenses(root = process.cwd()) {
  const text = readFileSync(resolve(root, licenseFile), 'utf8')
  assert.match(text, /MIT License/, '根目录缺少 MIT 许可证全文')

  for (const dir of publishableDirs(root)) {
    const copy = resolve(root, dir, licenseFile)
    assert.ok(existsSync(copy), `${dir} 里没有许可证：运行 npm run build:licenses`)
    assert.equal(readFileSync(copy, 'utf8'), text, `${dir} 的许可证与根目录不一致`)

    const manifest = resolve(root, dir, 'package.json')
    if (!existsSync(manifest)) continue // Flutter 包走 pubspec，没有 files 清单这回事
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
    assert.ok(pkg.license, `${dir} 的 package.json 没有 license 字段`)
    if (pkg.files) {
      assert.ok(
        pkg.files.includes(licenseFile),
        `${pkg.name} 的 files 里没有 ${licenseFile}：npm pack 会把许可证漏在包外`
      )
    }
  }

  const { assets } = readProvenance(root)
  const found = binaryAssets(root)
  for (const file of found) {
    const meta = assets[file]
    assert.ok(meta, `素材没有来源记录：${file}（补进 packages/common/src/assets/PROVENANCE.json）`)
    assert.ok(meta.origin && meta.license, `素材来源记录不完整：${file} 缺 origin 或 license`)
    if (meta.origin === 'third-party') {
      assert.ok(meta.source, `第三方素材必须写明出处：${file}`)
    }
  }
  for (const file of Object.keys(assets)) {
    assert.ok(found.includes(file), `来源记录指向已经不存在的素材：${file}`)
  }

  for (const dep of runtimeDependencies(root)) {
    const installed = installedLicense(root, dep.name)
    // 没装依赖时不假报（干净 checkout 里 node_modules 可能还没装）
    if (installed) assert.ok(installed.license, `随产物分发的依赖没有许可证信息：${dep.name}`)
  }

  assert.equal(
    readFileSync(resolve(root, thirdPartyFile), 'utf8'),
    thirdPartySource(root),
    `${thirdPartyFile} 过期：运行 npm run build:licenses 并提交生成物`
  )

  return `许可与来源检查通过：${packageLicensePaths(root).length} 个发布目录带许可证，${found.length} 个素材有来源记录`
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(checkLicenses())
}
