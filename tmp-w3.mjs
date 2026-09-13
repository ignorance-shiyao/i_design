import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const nav = readFileSync('src/data/nav.ts', 'utf8')
const routes = [...nav.matchAll(/to: '([^']+)'/g)].map((m) => m[1])
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const width of [390, 320]) {
  const p = await b.newPage({ viewport: { width, height: 844 } })
  const bad = []
  for (const route of routes) {
    await p.goto('http://localhost:5207/#' + route, { waitUntil: 'networkidle' })
    await p.evaluate(() => { document.documentElement.dataset.motion='off'; for (const el of document.querySelectorAll('.i-reveal')) el.classList.add('is-in') })
    await p.waitForTimeout(280)
    const info = await p.evaluate(() => {
      const over = document.documentElement.scrollWidth - window.innerWidth
      if (over <= 1) return null
      const culprits = []
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.right <= window.innerWidth + 1) continue
        let host = el.parentElement, scrollable = false
        while (host) { const ov = getComputedStyle(host).overflowX; if (ov==='auto'||ov==='scroll'){scrollable=true;break} host=host.parentElement }
        if (!scrollable) culprits.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`)
      }
      return { over, culprits: [...new Set(culprits)].slice(0, 3) }
    })
    if (info) bad.push({ route, ...info })
  }
  console.log(`\n== ${width}px ==`)
  for (const x of bad) console.log(`${x.route} 溢出 ${x.over}px  ${x.culprits.join(' / ')}`)
  console.log(`共 ${bad.length} / ${routes.length}`)
  await p.close()
}
await b.close()
