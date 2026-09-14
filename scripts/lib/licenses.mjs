/**
 * 许可与来源的共同口径：哪些目录会被发出去、发出去的东西里有什么别人的东西。
 *
 * 「这是 MIT 的」现在只写在 package.json 的一个字段里——那是一句声明，
 * 不是一份许可证：使用方装下来的包里没有 LICENSE 文件，法务那关过不了。
 * 素材同理：webp 插画是二进制，看不出是谁画的，不登记就等于没有来源。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

export const licenseFile = 'LICENSE'
export const thirdPartyFile = 'THIRD-PARTY.md'
export const provenanceFile = 'packages/common/src/assets/PROVENANCE.json'

/** 需要随包发布许可证的目录：有 package.json（npm）或 pubspec.yaml（pub）的都算 */
export function publishableDirs(root = process.cwd()) {
  return readdirSync(resolve(root, 'packages'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `packages/${d.name}`)
    .filter((dir) =>
      existsSync(resolve(root, dir, 'package.json')) || existsSync(resolve(root, dir, 'pubspec.yaml')))
    .sort()
}

/** 二进制素材：看不出内容的文件，必须有来源记录 */
const BINARY = /\.(webp|png|jpe?g|gif|avif|mp4|webm|woff2?|ttf|otf|eot)$/i

export function binaryAssets(root = process.cwd(), dir = 'packages/common/src/assets') {
  const out = []
  const walk = (rel) => {
    for (const entry of readdirSync(resolve(root, rel), { withFileTypes: true })) {
      const next = `${rel}/${entry.name}`
      if (entry.isDirectory()) walk(next)
      else if (BINARY.test(entry.name)) out.push(next)
    }
  }
  if (existsSync(resolve(root, dir))) walk(dir)
  return out.sort()
}

/** 会随产物一起到使用方那里的第三方包：各 package.json 的 dependencies / peerDependencies */
export function runtimeDependencies(root = process.cwd()) {
  const manifests = ['package.json', ...publishableDirs(root).map((d) => `${d}/package.json`)]
    .filter((f) => existsSync(resolve(root, f)))
  const deps = new Map() // 名字 → { range, usedBy[] }
  for (const file of manifests) {
    const pkg = JSON.parse(readFileSync(resolve(root, file), 'utf8'))
    for (const field of ['dependencies', 'peerDependencies']) {
      for (const [name, range] of Object.entries(pkg[field] ?? {})) {
        if (name.startsWith('@i-design/')) continue // 仓库内互相依赖，不是第三方
        const hit = deps.get(name) ?? { name, range, usedBy: [] }
        hit.usedBy.push(pkg.name ?? file)
        deps.set(name, hit)
      }
    }
  }
  return [...deps.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** 装好的依赖里写的许可证；没装就记 unresolved，让检查报出来而不是猜一个 */
export function installedLicense(root, name) {
  const pkg = resolve(root, 'node_modules', name, 'package.json')
  if (!existsSync(pkg)) return null
  const meta = JSON.parse(readFileSync(pkg, 'utf8'))
  const license = typeof meta.license === 'string' ? meta.license : meta.license?.type
  return { version: meta.version, license: license ?? null }
}

export function readProvenance(root = process.cwd()) {
  return JSON.parse(readFileSync(resolve(root, provenanceFile), 'utf8'))
}

export function thirdPartySource(root = process.cwd()) {
  const deps = runtimeDependencies(root).map((dep) => {
    const installed = installedLicense(root, dep.name)
    return { ...dep, version: installed?.version ?? null, license: installed?.license ?? null }
  })
  const assets = readProvenance(root).assets
  const byOrigin = {}
  for (const [file, meta] of Object.entries(assets)) {
    ;(byOrigin[meta.origin] ??= []).push({ file, ...meta })
  }
  const lines = [
    '<!-- 由 scripts/build-licenses.mjs 生成，请勿手改。改来源请改 packages/common/src/assets/PROVENANCE.json。 -->',
    '',
    '# 第三方与素材来源',
    '',
    `本项目以 MIT 发布，许可证全文见根目录 \`${licenseFile}\`，各发布包内也带同一份。`,
    '',
    '## 会进入使用方项目的第三方包',
    '',
    '这里只列各包 `dependencies` 与 `peerDependencies`；构建工具与测试框架不随产物分发，不在此列。',
    '',
    '| 包 | 版本范围 | 已装版本 | 许可证 | 谁依赖它 |',
    '| --- | --- | --- | --- | --- |',
    ...deps.map((d) =>
      `| ${d.name} | ${d.range} | ${d.version ?? '未安装'} | ${d.license ?? '未解析'} | ${d.usedBy.join('、')} |`),
    '',
    '## 图标',
    '',
    '图标是本仓库自绘的 SVG 路径数据（见 `packages/common/src/icons/index.ts`），',
    '不引第三方图标字体，也不含任何外部图标集的资源文件。',
    '',
    '## 位图素材',
    ''
  ]
  for (const origin of Object.keys(byOrigin).sort()) {
    lines.push(`### ${origin === 'in-repo' ? '本仓库素材' : '第三方素材'}`, '')
    lines.push('| 文件 | 作者 / 来源 | 许可证 | 备注 |', '| --- | --- | --- | --- |')
    for (const a of byOrigin[origin].sort((x, y) => x.file.localeCompare(y.file))) {
      lines.push(`| ${a.file} | ${a.author ?? a.source ?? ''} | ${a.license} | ${a.note ?? ''} |`)
    }
    lines.push('')
  }
  lines.push('字体不随包分发：各端都用系统字体栈，没有 @font-face 与字体文件。', '')
  return lines.join('\n')
}

export function packageLicensePaths(root = process.cwd()) {
  return publishableDirs(root).map((dir) => join(dir, licenseFile))
}
