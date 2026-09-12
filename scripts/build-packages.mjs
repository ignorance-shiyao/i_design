/**
 * 把各包编译成可以 npm install 的产物。
 *
 * 在此之前所有包的 main 都指向 src/index.ts——仓库里跑得通，是因为文档站用
 * tsconfig 的 paths 把它映射回了源码；而装到别人项目里，那里没有这份映射，
 * 拿到的是一个 import 不进去的 .ts 文件。也就是说这套东西一直没人能真正用上。
 *
 * 每个包单独一次 Vite library 构建，而不是打成一个大包：使用方装 React 那份时
 * 不该把 Vue 的实现也拖进 node_modules。
 *
 * Vue 2.7 那个包暂时不在这里——它现在编译不过去，而且不是这次改坏的
 * （详见台账 E9）。与其发一个装上去就报错的包，不如先不发。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'

/*
 * peerDependencies 与仓库内互相依赖的包一律外置。
 *
 * 移动端那两个包在 package.json 里把 vue-next / react 声明成了 dependencies，
 * 若不外置就会被整包内联进来：使用方同时装了移动端与桌面端时，同一个组件会有两份，
 * 而其中一份的样式与 provide/inject 并不共享。
 *
 * 把 vue 打进产物的话，使用方项目里会同时存在两份 Vue 运行时，
 * 而组件注册、provide/inject、响应式都依赖「是同一个实例」——
 * 症状是组件渲染得出来但 inject 全是 undefined，极难查。
 */
const EXTERNAL = [
  'vue', 'react', 'react-dom', 'react/jsx-runtime', 'react-dom/client',
  '@i-design/common', '@i-design/vue-next', '@i-design/react'
]

const targets = [
  { dir: 'common', entry: 'src/index.ts', plugins: () => [] },
  { dir: 'vue-next', entry: 'src/index.ts', plugins: () => [vue()] },
  { dir: 'mobile-vue', entry: 'src/index.ts', plugins: () => [vue()] },
  { dir: 'react', entry: 'src/index.ts', plugins: () => [react()] },
  { dir: 'mobile-react', entry: 'src/index.ts', plugins: () => [react()] }
]

const root = process.cwd()

async function buildOne(target) {
  const dir = join(root, 'packages', target.dir)
  /*
   * 只清自己的产物，不整个删 dist。
   *
   * 公共包的 dist 里还有 build-tokens.mjs 编出来的 tokens/——那是跨端校验读的东西，
   * 一起删掉的话，下一次 check:parity 才会报错，而错因看上去与本脚本毫无关系。
   */
  for (const name of ['index.mjs', 'index.cjs', 'index.mjs.map', 'index.cjs.map', 'style.css', 'types', 'styles']) {
    rmSync(join(dir, 'dist', name), { recursive: true, force: true })
  }

  await build({
    root: dir,
    configFile: false,
    logLevel: 'warn',
    plugins: target.plugins(),
    resolve: {
      alias: { '@i-design/common': join(root, 'packages/common/src/index.ts') }
    },
    build: {
      lib: { entry: join(dir, target.entry), formats: ['es', 'cjs'], fileName: (f) => `index.${f === 'es' ? 'mjs' : 'cjs'}` },
      outDir: join(dir, 'dist'),
      emptyOutDir: false,
      // 样式单独出口，不由 JS 自动注入：使用方可能要在自己的层叠顺序里决定何时引入
      cssCodeSplit: false,
      sourcemap: true,
      rollupOptions: {
        external: EXTERNAL,
        // 有 default 导出的包（整包注册的 install）不加这行会被 rollup 归成 auto，
        // CJS 使用方 require 回来的就成了「默认导出挂在 .default 上」的形状
        output: { exports: 'named', assetFileNames: 'style.css' }
      }
    }
  })
  return `${target.dir} → dist/index.mjs + index.cjs`
}

/*
 * 样式单独产出一份打平的 CSS。
 *
 * 源码里的 index.css 是一串 @import，直接发出去的话，使用方的构建要能解析
 * 相对路径的 @import 才行——而「能不能解析」取决于他用的打包器与配置。
 * 打平成一个文件，任何环境下 import 一次就够。
 *
 * 自己递归内联而不是交给打包器：这些样式里没有 url() 之类需要重写路径的东西，
 * 打包器能做的只是同样的拼接，却要多担一层它自己的行为（顺序、去重、压缩）。
 * 而层叠顺序在这里是有意义的——令牌必须排在组件之前，自适应层必须排在两者之间。
 */
function flattenCss(entry, seen = new Set()) {
  const abs = resolve(entry)
  if (seen.has(abs)) return ''   // 同一份被引两次时只保留第一次，否则后面的会覆盖掉中间的覆写
  seen.add(abs)
  const dir = dirname(abs)
  return readFileSync(abs, 'utf8').replace(
    /@import\s+['"]([^'"]+)['"]\s*;/g,
    (_, ref) => flattenCss(join(dir, ref), seen)
  )
}

function buildStyles() {
  const dir = join(root, 'packages/common')
  const out = join(dir, 'dist/styles')
  mkdirSync(out, { recursive: true })
  for (const name of ['index', 'mobile']) {
    const src = join(dir, `src/styles/${name}.css`)
    if (!existsSync(src)) continue
    writeFileSync(join(out, `${name}.css`), flattenCss(src))
  }
  return 'common → dist/styles/index.css + mobile.css'
}

/**
 * 类型声明。
 *
 * 没有 .d.ts 的话，使用方 import 进去全是 any——组件有哪些属性、属性是什么类型
 * 全靠翻文档，而这套体系的属性约束本来就是它的一部分。
 */
function buildTypes(dirs) {
  for (const dir of dirs) {
    const pkg = join(root, 'packages', dir)
    const tsconfig = join(pkg, 'tsconfig.build.json')
    /*
     * 公共包必须先编译，其余包再指向它编出来的 dist/types。
     *
     * 根 tsconfig 的 paths 把 @i-design/common 映射到公共包的源码，
     * 于是编 vue-next 时公共包的 .ts 也被拉进同一个程序里，而它们不在
     * rootDir(src) 底下——tsc 直接报 TS6059。把映射改成已编好的声明文件，
     * 公共包就成了一个真正的外部依赖，跟使用方装到 node_modules 里的情形一致。
     */
    const paths = dir === 'common'
      ? { '@i-design/common': ['./src/index.ts'], '@i-design/common/*': ['./src/*'] }
      : { '@i-design/common': ['../common/dist/types/index.d.ts'], '@i-design/common/*': ['../common/dist/types/*'] }
    writeFileSync(tsconfig, JSON.stringify({
      extends: '../../tsconfig.json',
      compilerOptions: {
        noEmit: false,
        declaration: true,
        emitDeclarationOnly: true,
        outDir: 'dist/types',
        rootDir: 'src',
        composite: false,
        baseUrl: '.',
        paths
      },
      // 公共包的 .webp 声明必须一起进来：各包都经 @i-design/common 间接引到它，
      // 不带上的话 tsc 会报「找不到模块 './assets/illustrations/...'」
      include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue', '../common/src/assets.d.ts']
    }, null, 2))
    try {
      execFileSync('npx', ['vue-tsc', '-p', tsconfig], { cwd: root, stdio: 'pipe' })
    } catch (error) {
      // 默认的错误对象会把整段 stdout 打成字节数组，看不出到底哪里错了
      throw new Error(`${dir} 类型声明失败：\n${String(error.stdout ?? '').trim()}`)
    } finally {
      rmSync(tsconfig, { force: true })
    }
  }
  return `类型声明 → ${dirs.length} 个包的 dist/types`
}

// 令牌产物是 dist 的一部分，也得是最新的：使用方装到的 tokens 不该停在上一次构建
execFileSync('npm', ['run', 'build:tokens'], { cwd: root, stdio: 'pipe' })

const done = []
for (const target of targets) done.push(await buildOne(target))
done.push(buildStyles())
done.push(buildTypes(targets.filter((t) => t.types !== false).map((t) => t.dir)))
for (const line of done) console.log(' ', line)
