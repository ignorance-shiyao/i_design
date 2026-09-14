/** 故障注入：插画矩阵这条检查真的会红吗。 */
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkIllustrations } from './check-illustrations.mjs'

const META = 'packages/common/src/illustrationMeta.ts'
const ASSETS = 'packages/common/src/assets/illustrations'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-illus-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  cpSync(META, join(root, META), { recursive: true })
  cpSync(ASSETS, join(root, ASSETS), { recursive: true })
  return root
}

function patch(root, from, to) {
  const path = join(root, META)
  const text = readFileSync(path, 'utf8')
  assert.ok(text.includes(from), `测试样本失效：找不到 ${from}`)
  writeFileSync(path, text.replace(from, to))
}

test('当前仓库通过', async () => {
  assert.match(await checkIllustrations(), /插画检查通过/)
})

test('素材加进目录却没登记时失败——文档与校验都看不见它', async (t) => {
  const root = fixture(t)
  cpSync(join(root, ASSETS, 'mascot/mascot.webp'), join(root, ASSETS, 'mascot/newcomer.webp'))
  await assert.rejects(checkIllustrations(root), /没写进 illustrationMeta/)
})

test('素材被删掉、矩阵还留着那条时失败', async (t) => {
  const root = fixture(t)
  rmSync(join(root, ASSETS, 'mascot/mascot.webp'))
  await assert.rejects(checkIllustrations(root), /已经不存在的素材/)
})

test('替代文本写成文件名时失败', async (t) => {
  const root = fixture(t)
  patch(root, "alt: '小白与十五主形象',", "alt: 'mascot.webp',")
  await assert.rejects(checkIllustrations(root), /是文件名/)
})

test('替代文本以「插画」开头时失败——读屏器已经报过一次「图片」', async (t) => {
  const root = fixture(t)
  patch(root, "alt: '小白与十五主形象',", "alt: '插画：小白与十五',")
  await assert.rejects(checkIllustrations(root), /开头/)
})

test('分主题的族只给了一半时失败', async (t) => {
  const root = fixture(t)
  patch(root, "    key: 'hero.dark',", "    key: 'hero.dark2',")
  patch(root, "    theme: 'dark',\n    width: 600", "    theme: 'light',\n    width: 600")
  await assert.rejects(checkIllustrations(root), /只给了 light/)
})

test('缺 @2x 时失败——高密度屏上会糊', async (t) => {
  const root = fixture(t)
  rmSync(join(root, ASSETS, 'mascot/mascot@2x.webp'))
  await assert.rejects(checkIllustrations(root), /缺 @2x/)
})

test('@2x 换成了另一张稿子（尺寸对不上）时失败', async (t) => {
  const root = fixture(t)
  renameSync(join(root, ASSETS, 'error/404@2x.webp'), join(root, ASSETS, 'error/tmp.webp'))
  cpSync(join(root, ASSETS, 'error/500@2x.webp'), join(root, ASSETS, 'error/404@2x.webp'))
  rmSync(join(root, ASSETS, 'error/tmp.webp'))
  await assert.rejects(checkIllustrations(root), /@2x 宽度|@2x 高度/)
})

test('显示宽度与素材本身对不上时失败', async (t) => {
  const root = fixture(t)
  patch(root, "    theme: 'any',\n    width: 320", "    theme: 'any',\n    width: 300")
  await assert.rejects(checkIllustrations(root), /显示宽度写成/)
})

/** 把一张素材重新编码成烤了白底的版本——就是这条规则要拦的那种素材 */
async function bakeBackground(root, rel) {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  try {
    const page = await browser.newPage()
    await page.setContent('<canvas id="c"></canvas>')
    const baked = await page.evaluate(async (d) => {
      const img = new Image()
      img.src = `data:image/webp;base64,${d}`
      await img.decode()
      const canvas = document.getElementById('c')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      return canvas.toDataURL('image/webp').split(',')[1]
    }, readFileSync(join(root, rel)).toString('base64'))
    writeFileSync(join(root, rel), Buffer.from(baked, 'base64'))
  } finally {
    await browser.close()
  }
}

test('素材里烤了白底时失败——深色主题上那就是一个白盒子', async (t) => {
  const root = fixture(t)
  await bakeBackground(root, join(ASSETS, 'mascot/mascot.webp'))
  await assert.rejects(checkIllustrations(root), /四角不是透明的/)
})
