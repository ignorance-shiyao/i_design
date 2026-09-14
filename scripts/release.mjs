/**
 * 发布。默认只做 dry-run，真发要显式加 --yes 且环境里有 NPM_TOKEN。
 *
 * 默认不发是刻意的：这个脚本会在本地被随手跑一次来「看看会发出去什么」，
 * 那一次不该把包推上去。已经发出去的版本撤不回来——npm 的 unpublish
 * 会让所有装了它的项目在下一次安装时失败，所以只能发下一个修订版去修。
 *
 * 顺序也是刻意的：先核对，再构建，再打包，最后才轮到 publish。
 * 任何一步失败都在推送之前停住。
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { checkRelease } from './check-release.mjs'
import { publishableDirs } from './lib/licenses.mjs'

const root = process.cwd()
const args = process.argv.slice(2)
const tagArg = args.find((a) => a.startsWith('--tag='))
const tag = tagArg ? tagArg.slice('--tag='.length) : 'next'
const live = args.includes('--yes')

const run = (cmd, params, cwd = root) =>
  execFileSync(cmd, params, { cwd, stdio: 'pipe', encoding: 'utf8' })

/** npm publish --dry-run 把清单写在 stderr 上，只读 stdout 会什么都拿不到 */
const runBoth = (cmd, params, cwd = root) => {
  const out = spawnSync(cmd, params, { cwd, encoding: 'utf8' })
  if (out.status !== 0) throw new Error(`${cmd} ${params.join(' ')} 失败：\n${out.stdout}\n${out.stderr}`)
  return `${out.stdout}\n${out.stderr}`
}

console.log(checkRelease(root))

// npm 包目录才发；Flutter 走 pub，不在这个脚本里
const dirs = publishableDirs(root).filter((dir) => !dir.endsWith('flutter'))

console.log('构建发布产物…')
run('npm', ['run', 'build:packages'])

const work = mkdtempSync(join(tmpdir(), 'i-design-release-'))
try {
  for (const dir of dirs) {
    const packed = run('npm', ['pack', '--pack-destination', work], resolve(root, dir)).trim().split('\n').pop()
    const dry = runBoth('npm', ['publish', '--dry-run', `--tag=${tag}`], resolve(root, dir))
    const files = /total files:\s*(\d+)/.exec(dry)?.[1] ?? '?'
    console.log(`  ${dir} → ${packed}（${files} 个文件，tag=${tag}）`)
  }

  if (!live) {
    console.log(`\n以上是 dry-run。真发：npm run release -- --tag=${tag} --yes（需要 NPM_TOKEN）`)
  } else if (!process.env.NPM_TOKEN) {
    console.error('\n拒绝发布：环境里没有 NPM_TOKEN。发布凭证只放在 CI 的 secret 里，不放在任何人的机器上。')
    process.exit(1)
  } else {
    for (const dir of dirs) {
      run('npm', ['publish', `--tag=${tag}`, '--access=public'], resolve(root, dir))
      console.log(`  已发布 ${dir}（tag=${tag}）`)
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true })
}
