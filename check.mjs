import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 760, height: 1000 }, deviceScaleFactor: 2 })
const errs = []
p.on('pageerror', e => errs.push(String(e)))
await p.goto('http://localhost:4252/', { waitUntil: 'networkidle' })
await p.waitForTimeout(800)

// 分页序列必须与 Vue 端逐字一致（同一份 buildPages）
const pages = await p.locator('.i-pagination__item').allInnerTexts()
console.log('分页序列(第12页):', pages.filter(Boolean).join(' '))
await p.locator('.i-pagination__ellipsis').last().click(); await p.waitForTimeout(300)
console.log('省略号跳 5 页后:', (await p.locator('.i-pagination__item').allInnerTexts()).filter(Boolean).join(' '))

// 表格排序三态
const pts = () => p.locator('.i-table-c tbody tr td:nth-child(4)').allInnerTexts()
console.log('表格 原始:', (await pts()).join(','))
const th = p.locator('.i-table-c th', { hasText: '故事点' })
await th.click(); console.log('升序:', (await pts()).join(','))
await th.click(); console.log('降序:', (await pts()).join(','))
await th.click(); console.log('复位:', (await pts()).join(','))

// Select 键盘：跳过禁用项
const trigger = p.locator('.i-select__trigger')
await trigger.focus()
await p.keyboard.press('ArrowDown')   // 展开
await p.keyboard.press('ArrowDown')   // 需求 -> 缺陷
await p.keyboard.press('ArrowDown')   // -> 任务
await p.keyboard.press('ArrowDown')   // 风险禁用，应停在任务
await p.keyboard.press('Enter')
await p.waitForTimeout(300)
console.log('Select 键盘(跳过禁用):', await p.locator('.i-select__label').innerText())

// Tabs 方向键循环 + 跳过禁用
const tabs = p.locator('.i-tabs').first()
await tabs.locator('.i-tabs__tab.is-active').focus()
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200)
console.log('Tabs →:', await tabs.locator('.i-tabs__tab.is-active').innerText())
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200)
console.log('Tabs 跳过禁用后:', await tabs.locator('.i-tabs__tab.is-active').innerText())

console.log('Badge:', (await p.locator('.i-badge__mark').allInnerTexts()).filter(Boolean).join(','),
            '| 骨架条:', await p.locator('.i-skeleton__bar').count())
await p.screenshot({ path: '/tmp/react-full.png', fullPage: true })
console.log('errors:', errs.length ? errs.filter(e=>!e.includes('404')) : 'none')
await b.close()
