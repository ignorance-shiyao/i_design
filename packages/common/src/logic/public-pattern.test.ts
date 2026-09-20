import { describe, expect, it } from 'vitest'
import { PUBLIC_ARTICLES, PUBLIC_PLANS, PUBLIC_SEARCH_LIMIT, publicLocation, publicPrice, publicRoute, searchPublicHelp } from './public-pattern'

describe('B17 公共网页状态', () => {
  it('按年显示总额与参考月均，金额按分取整且起步版为零', () => {
    expect(publicPrice(PUBLIC_PLANS[1], 'monthly')).toEqual({ amount: '99.00', period: '月', monthly: '99.00' })
    expect(publicPrice(PUBLIC_PLANS[1], 'yearly')).toEqual({ amount: '990.00', period: '年', monthly: '82.50' })
    expect(publicPrice(PUBLIC_PLANS[2], 'yearly').monthly).toBe('249.17')
    expect(publicPrice(PUBLIC_PLANS[0], 'yearly').amount).toBe('0.00')
  })
  it('帮助搜索覆盖正文，多关键词同时匹配，空白返回全部', () => {
    expect(searchPublicHelp('   ')).toHaveLength(PUBLIC_ARTICLES.length)
    expect(searchPublicHelp('  年付 十二 ')).toHaveLength(1)
    expect(searchPublicHelp('年付 十二')[0].id).toBe('plans')
    expect(searchPublicHelp('没有这篇文章')).toEqual([])
  })
  it('正文不能被搜索表达式或 HTML 当成代码执行', () => {
    expect(searchPublicHelp('.*')).toEqual([])
    expect(searchPublicHelp('<script>')).toEqual([])
  })
  it('未知、重复参数和原型属性不能伪装成有效栏目', () => {
    for (const view of ['missing', 'toString', '__proto__', ['help', 'home'], 1]) {
      expect(publicRoute({ view }).missingView).toBe(true)
    }
    expect(publicRoute({}).missingView).toBe(false)
    expect(publicRoute({ view: 'help' }).view).toBe('help')
  })
  it('失效文章明确报缺失，不默默回到首篇', () => {
    expect(publicRoute({ view: 'help', article: 'missing' }).missingArticle).toBe(true)
    expect(publicRoute({ view: 'help', article: ['plans', 'theme'] }).missingArticle).toBe(true)
    expect(publicRoute({ view: 'help' }).missingArticle).toBe(false)
    expect(publicRoute({ article: 'theme' }).article?.title).toContain('明暗主题')
  })
  it('地址往返保留搜索和文章；栏目切换移除无关参数', () => {
    const article = publicLocation('help', { article: 'plans', search: ' 年付 ' })
    expect(publicRoute(article.query)).toMatchObject({ view: 'help', search: '年付', article: { id: 'plans' } })
    expect(publicLocation('pricing', { cycle: 'yearly', article: 'plans', search: '年付' }).query).toEqual({ view: 'pricing', cycle: 'yearly' })
    expect(publicRoute({ q: '字'.repeat(200) }).search).toHaveLength(PUBLIC_SEARCH_LIMIT)
    expect(publicLocation('help', { search: ' ' }).query).toEqual({ view: 'help' })
  })
})
