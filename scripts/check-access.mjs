/** B16：真实组件的操作结果、权限切换与宽窄屏测量；只使用明确标注的内存示例。 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { auditInPage, MAX_MEASURE, MAX_STRETCH_PX, MAX_STRETCH_PCT } from './check-layout.mjs'

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const base = `http://127.0.0.1:${server.httpServer.address().port}/#/design/access`
  const button = (page, name) => page.getByRole('button', { name, exact: true })
  async function choose(page, name, value) {
    await page.getByRole('combobox', { name, exact: true }).click()
    await page.getByRole('option', { name: value, exact: true }).click()
  }
  async function login(page, label) {
    await choose(page, '示例账号', label)
    await button(page, '模拟登录').click()
  }
  async function scenario(action, mutate, routePattern = '**/packages/common/src/logic/access-pattern.ts*') {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.setDefaultTimeout(5000)
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    let changed = false
    if (mutate) await page.route(routePattern, async route => {
      const response = await route.fetch(), source = await response.text(), body = mutate(source)
      changed ||= body !== source
      await route.fulfill({ response, body })
    })
    try {
      await page.goto(base, { waitUntil: 'networkidle' })
      await action(page)
      assert.deepEqual(errors, [], '页面运行错误')
    } finally {
      await context.close()
      if (mutate) assert.ok(changed, '故障注入必须命中浏览器执行的代码')
    }
  }
  async function visual(page, name) {
    const samples = []
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.evaluate(() => document.fonts.ready)
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const sample = await page.evaluate(() => ({
        width: innerWidth, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        maxLineEm: Math.max(...[...document.querySelectorAll('.access-page p')].map(p => p.getBoundingClientRect().width / parseFloat(getComputedStyle(p).fontSize))),
        cardHeights: [...document.querySelectorAll('.access-cards > .access-card')].map(p => Math.round(p.getBoundingClientRect().height))
      }))
      assert.equal(sample.overflow, 0, '账号页横向溢出')
      assert.ok(sample.maxLineEm <= 45.1, '正文行长超限')
      if (width === 1440) {
        const audit = await page.evaluate(auditInPage, { maxMeasure: MAX_MEASURE, maxStretchPx: MAX_STRETCH_PX, maxStretchPct: MAX_STRETCH_PCT })
        assert.deepEqual(audit.findings, [], '正文或卡片撑高超限')
      }
      samples.push(sample)
      await page.screenshot({ path: `node_modules/b16-shots/${name}-${width}.png`, fullPage: true })
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    for (const theme of ['light', 'dark']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) {
        await page.getByTitle(theme === 'dark' ? '切换到暗色' : '切换到亮色', { exact: true }).click()
      }
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme, '必须切换实际主题')
      const { violations } = await new AxeBuilder({ page }).include('.access-page').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      assert.deepEqual(violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id}: ${v.nodes.map(n => n.target).join(',')}`), [], `${name} ${theme} 无障碍`)
    }
    await page.getByTitle('切换到亮色', { exact: true }).click()
    console.log(`${name}: ${JSON.stringify(samples)}；亮暗 serious/critical=0`)
  }
  const member = async page => {
    await login(page, '许禾 · 成员')
    assert.equal(await page.getByRole('navigation', { name: '工作区菜单' }).getByRole('button').count(), 1, '成员菜单泄漏')
    assert.equal(await button(page, '用户管理').count(), 0, '成员不能进入管理页')
  }
  const manager = async page => {
    await login(page, '周宁 · 主管')
    await button(page, '用户管理').click()
    assert.equal(await page.locator('.access-demo').getByText(/@example.test/).count(), 0, '主管邮箱泄漏')
    assert.equal(await button(page, '管理 许禾').isDisabled(), true, '主管管理操作越权')
  }
  const lastAdmin = async page => {
    await login(page, '林青 · 管理员')
    await button(page, '用户管理').click()
    await button(page, '管理 林青').click()
    await choose(page, '用户角色', '成员')
    await button(page, '保存').click()
    assert.match(await page.locator('.access-feedback').innerText(), /至少保留一名/, '最后管理员保护失效')
    assert.equal(await page.getByRole('combobox', { name: '用户角色' }).count(), 1, '校验失败应保留表单')
  }
  const profile = async page => {
    await login(page, '许禾 · 成员')
    await button(page, '编辑个人设置').click()
    await page.getByLabel('显示名称', { exact: true }).fill('许禾新名称')
    await page.getByRole('checkbox', { name: '接收工作通知' }).focus()
    await page.getByRole('checkbox', { name: '接收工作通知' }).press('Space')
    await button(page, '保存').click()
    assert.match(await page.getByRole('region', { name: '个人设置', exact: true }).innerText(), /许禾新名称[\s\S]*已开启/, '个人设置没有保存')
  }
  await mkdir('node_modules/b16-shots', { recursive: true })
  await scenario(async page => {
    await visual(page, 'login')
    await login(page, '陈默 · 成员 · 已停用')
    assert.match(await page.locator('.access-feedback').innerText(), /已停用或不存在/)
    await login(page, '林青 · 管理员')
    await button(page, '用户管理').click()
    assert.equal(await page.locator('.access-demo').getByText(/@example.test/).count(), 4)
    await visual(page, 'admin-users')
    await button(page, '组织管理').click()
    await button(page, '新建组织').click()
    await page.getByLabel('组织名称', { exact: true }).fill('支持组')
    await visual(page, 'organization-form')
    await button(page, '保存').click()
    await page.getByRole('region', { name: '组织 支持组', exact: true }).waitFor()
    await button(page, '用户管理').click()
    await button(page, '管理 许禾').click()
    await choose(page, '用户角色', '主管')
    await choose(page, '所属组织', '支持组')
    await button(page, '保存').click()
    assert.match(await page.getByRole('region', { name: '用户 许禾', exact: true }).innerText(), /主管[\s\S]*支持组/)
    await button(page, '角色权限').click()
    await visual(page, 'roles')
    await button(page, '退出登录').click()
    await login(page, '许禾 · 主管')
    await button(page, '用户管理').click()
    assert.equal(await page.locator('.access-demo').getByText(/@example.test/).count(), 0)
    assert.equal(await button(page, '管理 林青').isDisabled(), true)
    await visual(page, 'manager-users')
    await button(page, '个人设置').click()
    await button(page, '编辑个人设置').click()
    await page.getByLabel('显示名称', { exact: true }).fill('未保存草稿')
    assert.equal(await button(page, '退出登录').isDisabled(), true)
    await button(page, '取消').click()
    await page.getByRole('alertdialog').waitFor()
    await button(page, '继续编辑').click()
    assert.equal(await page.getByLabel('显示名称', { exact: true }).inputValue(), '未保存草稿')
    await button(page, '取消').click()
    await button(page, '放弃修改并离开').click()
    assert.ok(!(await page.locator('.access-demo').innerText()).includes('未保存草稿'))
  })
  for (const action of [member, manager, lastAdmin, profile]) await scenario(action)
  // 实际改坏送进浏览器的模型代码，必须由业务断言抓到，而非超时或运行错误。
  const faults = [
    ['成员菜单', s => s.replace('member: []', 'member: ["directory"]'), member, /成员菜单泄漏/],
    ['主管邮箱', s => s.replace('accessCan(state, session, "contact") ? { email } : {}', 'true ? { email } : {}'), manager, /主管邮箱泄漏/],
    ['主管动作', s => s.replace('manager: ["directory"]', 'manager: ["directory", "manage"]'), manager, /主管管理操作越权/],
    ['最后管理员', s => s.replace('throw new AccessError(422, "至少保留一名启用的管理员");', '/* 故障：移除最后管理员保护 */'), lastAdmin, /最后管理员保护失效/],
    ['设置保存', s => s.replace('notifications: command.notifications', 'notifications: user.notifications'), profile, /个人设置没有保存/]
  ]
  for (const [name, mutate, action, expected] of faults) {
    await assert.rejects(scenario(action, mutate), expected)
    console.log(`故障注入已拦截：${name}`)
  }
  const visualFaults = [
    ['横向溢出', s => s.replace(/\.access-demo(?:\[data-v-[\w-]+\])?\s*\{/, '$& min-width: 1800px;'), /账号页横向溢出/],
    ['正文行长', s => s.replace('max-width: 45em;', 'max-width: none;'), /正文行长超限/],
    ['卡片撑高', s => s.replace('columns: 20em;', 'display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));'), /正文或卡片撑高超限/],
    ['无障碍名称', s => s.replaceAll('模拟登录', ''), /无障碍/]
  ]
  for (const [name, mutate, expected] of visualFaults) {
    await assert.rejects(scenario(async page => {
      if (name === '卡片撑高') { await login(page, '林青 · 管理员'); await button(page, '角色权限').click() }
      await visual(page, `fault-${name}`)
    }, mutate, '**/src/pages/AccessPatternsPage.vue*'), expected)
    console.log(`故障注入已拦截：${name}`)
  }
  await assert.rejects(scenario(page => visual(page, 'fault-theme'),
    s => s.replace('theme.value = theme.value === "light" ? "dark" : "light";', 'theme.value = "light";'),
    '**/src/composables/useTheme.ts*'), /必须切换实际主题/)
  console.log('故障注入已拦截：主题开关失效')
  console.log('B16 检查通过：操作闭环、权限边界、离开保护、五种状态宽窄屏与亮暗无障碍，10 次源码故障注入')
} finally {
  await browser?.close()
  await server.close()
}
