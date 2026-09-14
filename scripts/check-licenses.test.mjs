/**
 * 故障注入：许可与来源的每条断言都要有一个对应的坏例子。
 * 「包里带了许可证」这种事一旦靠人记，就会在新增一个包的那天漏掉。
 */
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkLicenses } from './check-licenses.mjs'
import { thirdPartyFile, thirdPartySource, licenseFile, packageLicensePaths, runtimeDependencies } from './lib/licenses.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-license-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  cpSync('packages', join(root, 'packages'), { recursive: true })
  copyFileSync('package.json', join(root, 'package.json'))
  copyFileSync(licenseFile, join(root, licenseFile))
  copyFileSync(thirdPartyFile, join(root, thirdPartyFile))
  // 版本与许可证取自 node_modules，只复制清单文件：不带这些，生成的表会与仓库里的不一致
  for (const dep of runtimeDependencies()) {
    const manifest = join('node_modules', dep.name, 'package.json')
    if (existsSync(manifest)) cpSync(manifest, join(root, manifest))
  }
  return root
}

/** 改完素材或包之后重新生成清单，好让断言落在内容而不是新鲜度上 */
function regenerate(root) {
  writeFileSync(join(root, thirdPartyFile), thirdPartySource(root))
}

test('当前仓库通过', (t) => {
  assert.match(checkLicenses(fixture(t)), /许可与来源检查通过/)
})

test('某个包没带许可证时失败', (t) => {
  const root = fixture(t)
  rmSync(join(root, 'packages/react', licenseFile))
  assert.throws(() => checkLicenses(root), /packages\/react 里没有许可证/)
})

test('包里的许可证被改过（与根目录不一致）时失败', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'packages/vue-next', licenseFile), 'All rights reserved.\n')
  assert.throws(() => checkLicenses(root), /许可证与根目录不一致/)
})

test('files 清单漏掉许可证时失败——npm pack 会把它留在包外', (t) => {
  const root = fixture(t)
  const file = join(root, 'packages/react/package.json')
  writeFileSync(file, readFileSync(file, 'utf8').replace('"LICENSE"', '"dist"'))
  assert.throws(() => checkLicenses(root), /files 里没有 LICENSE/)
})

test('新增素材没登记来源时失败', (t) => {
  const root = fixture(t)
  copyFileSync(
    join(root, 'packages/common/src/assets/illustrations/mascot/mascot.webp'),
    join(root, 'packages/common/src/assets/illustrations/mascot/mascot-new.webp')
  )
  assert.throws(() => checkLicenses(root), /素材没有来源记录/)
})

test('素材删了但登记还留着时失败', (t) => {
  const root = fixture(t)
  rmSync(join(root, 'packages/common/src/assets/illustrations/mascot/mascot.webp'))
  regenerate(root)
  assert.throws(() => checkLicenses(root), /来源记录指向已经不存在的素材/)
})

test('第三方素材没写出处时失败', (t) => {
  const root = fixture(t)
  const file = join(root, 'packages/common/src/assets/PROVENANCE.json')
  const data = JSON.parse(readFileSync(file, 'utf8'))
  const first = Object.keys(data.assets)[0]
  data.assets[first] = { origin: 'third-party', license: 'CC-BY-4.0' }
  writeFileSync(file, JSON.stringify(data, null, 2))
  regenerate(root)
  assert.throws(() => checkLicenses(root), /第三方素材必须写明出处/)
})

test('改了来源却没重新生成清单时失败', (t) => {
  const root = fixture(t)
  const file = join(root, 'packages/common/src/assets/PROVENANCE.json')
  const data = JSON.parse(readFileSync(file, 'utf8'))
  const first = Object.keys(data.assets)[0]
  data.assets[first].author = '别人'
  writeFileSync(file, JSON.stringify(data, null, 2))
  assert.throws(() => checkLicenses(root), /THIRD-PARTY\.md 过期/)
})

test('新增一个发布目录时，许可证清单跟着变长', () => {
  assert.ok(packageLicensePaths().length >= 6)
})
