/**
 * 插画矩阵与素材的一致性（astra.md 的 C06）。
 *
 * 插画是这套体系里唯一的二进制资产：改错了不会有类型报错，看一眼截图
 * 也未必看得出来（少一张 @2x，只有 Retina 用户看到糊的那张）。所以查六件事：
 *
 * 1. 矩阵与磁盘一一对应——少一条，那张图在文档里等于不存在；多一条，文档会渲染 404。
 * 2. 每张都有 @2x，且尺寸恰好是两倍（高度允许 ±1，导出时的取整）。
 *    只差一点点的 @2x 往往是从别的稿子导出来的，srcset 一换密度就跳一下。
 * 3. alt 非空、不是文件名、不以「图片」「插画」开头——读屏器念「插画 插画」没有信息。
 * 4. 四角必须全透明。素材里烤进白底，浅色下看不出来，深色页面上就是一个白盒子；
 *    这是「一张图两个主题通用」的前提，也是唯一能自动判定的部分。
 * 5. 成对主题的族（theme 为 light/dark 的）必须两张都在，否则切到另一个主题时没图。
 * 6. 只收 WebP。PNG 同画质要大三到五倍，而这批全是连续渐变的绘画稿。
 *
 * 第 4 条要真解码 WebP，所以起一个 Chromium 用 canvas 读像素——
 * Node 侧没有解码器，自己写一个只会引入第二份实现。
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const ASSET_DIR = 'packages/common/src/assets/illustrations'

async function loadMeta(root) {
  const bundled = await build({
    stdin: {
      contents: `export * from './packages/common/src/illustrationMeta.ts'`,
      resolveDir: root,
      loader: 'ts'
    },
    bundle: true, write: false, format: 'esm', platform: 'node'
  })
  return import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`)
}

const twoX = (file) => file.replace(/\.webp$/, '@2x.webp')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

/** 一次性把所有素材解码成尺寸与四角 alpha */
async function measure(root, files) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined
  })
  try {
    const page = await browser.newPage()
    await page.setContent('<canvas id="c"></canvas>')
    const out = new Map()
    for (const file of files) {
      const data = readFileSync(join(root, file)).toString('base64')
      out.set(file, await page.evaluate(async (d) => {
        const img = new Image()
        img.src = `data:image/webp;base64,${d}`
        await img.decode()
        const canvas = document.getElementById('c')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        const alphaAt = (x, y) => px[(y * canvas.width + x) * 4 + 3] / 255
        // 四角各取 4×4：单个像素可能恰好落在透明缝里，一片就不会
        let corner = 0
        for (const [ox, oy] of [
          [0, 0], [canvas.width - 4, 0], [0, canvas.height - 4], [canvas.width - 4, canvas.height - 4]
        ]) {
          for (let x = 0; x < 4; x += 1) {
            for (let y = 0; y < 4; y += 1) corner = Math.max(corner, alphaAt(ox + x, oy + y))
          }
        }
        return { width: img.width, height: img.height, corner }
      }, data))
    }
    return out
  } finally {
    await browser.close()
  }
}

export async function checkIllustrations(root = process.cwd()) {
  const { illustrationMeta } = await loadMeta(root)

  /* ---------- 1. 矩阵与磁盘一一对应 ---------- */
  const onDisk = walk(join(root, ASSET_DIR)).map((p) => relative(root, p).split('\\').join('/'))
  const base = onDisk.filter((f) => !f.includes('@2x'))
  const listed = illustrationMeta.map((m) => m.file)

  const missing = base.filter((f) => !listed.includes(f))
  assert.deepEqual(missing, [], `这些素材没写进 illustrationMeta，文档与校验都看不见它们：${missing.join('、')}`)
  const stale = listed.filter((f) => !existsSync(join(root, f)))
  assert.deepEqual(stale, [], `illustrationMeta 里有已经不存在的素材：${stale.join('、')}`)

  const badFormat = onDisk.filter((f) => !f.endsWith('.webp'))
  assert.deepEqual(badFormat, [], `插画目录只收 WebP：${badFormat.join('、')}`)

  /* ---------- 2. 替代文本 ---------- */
  for (const meta of illustrationMeta) {
    assert.ok(meta.alt.trim(), `${meta.key} 没有替代文本`)
    assert.ok(
      !/\.(webp|png|jpe?g|svg)$/i.test(meta.alt.trim()),
      `${meta.key} 的替代文本是文件名（${meta.alt}）——读屏器念出来没有信息`
    )
    assert.ok(
      !/^(图片|插画|图像|image)/i.test(meta.alt.trim()),
      `${meta.key} 的替代文本以「${meta.alt.slice(0, 2)}」开头——读屏器本来就会先报「图片」，这里要说画了什么`
    )
    assert.ok(meta.usage.trim(), `${meta.key} 没写用途，矩阵里就无从判断该用哪张`)
  }

  /* ---------- 3. 成对主题 ---------- */
  const byCategory = new Map()
  for (const meta of illustrationMeta) {
    byCategory.set(meta.category, [...(byCategory.get(meta.category) || []), meta])
  }
  for (const [category, items] of byCategory) {
    const themes = new Set(items.map((m) => m.theme))
    if (themes.has('light') || themes.has('dark')) {
      assert.ok(
        themes.has('light') && themes.has('dark'),
        `${category} 声明了分主题的插画，却只给了 ${[...themes].join('、')} 一半——切到另一个主题时没有图`
      )
    }
  }

  /* ---------- 4. @2x 与四角透明（要真解码） ---------- */
  const wanted = []
  for (const meta of illustrationMeta) {
    const hi = twoX(meta.file)
    assert.ok(existsSync(join(root, hi)), `${meta.key} 缺 @2x，高密度屏上会糊：${hi}`)
    wanted.push(meta.file, hi)
  }
  const sizes = await measure(root, wanted)

  for (const meta of illustrationMeta) {
    const one = sizes.get(meta.file)
    const two = sizes.get(twoX(meta.file))
    assert.equal(
      two.width, one.width * 2,
      `${meta.key} 的 @2x 宽度是 ${two.width}，不是 ${one.width * 2}——两张多半不是同一稿导出的`
    )
    assert.ok(
      Math.abs(two.height - one.height * 2) <= 1,
      `${meta.key} 的 @2x 高度是 ${two.height}，与 ${one.height * 2} 差得超过一像素`
    )
    assert.equal(
      one.width, meta.width,
      `${meta.key} 的显示宽度写成 ${meta.width}，素材本身是 ${one.width}——srcset 的 1x 会被浏览器缩放`
    )
    for (const [file, m] of [[meta.file, one], [twoX(meta.file), two]]) {
      assert.ok(
        m.corner < 0.05,
        `${file} 的四角不是透明的（alpha ${m.corner.toFixed(2)}）——素材里烤了底，深色主题下会出现一个色块`
      )
    }
  }

  return `插画检查通过：${illustrationMeta.length} 张（含 @2x 共 ${wanted.length} 个文件），矩阵齐全、@2x 尺寸吻合、四角透明可跨主题`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkIllustrations().then(
    (msg) => console.log(msg),
    (err) => {
      console.error(`插画检查未通过：${err.message}`)
      process.exit(1)
    }
  )
}
