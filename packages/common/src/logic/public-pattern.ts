/** B17 公共网页配方。内容为自包含示例，不代表商业报价或发布承诺。 */
export const PUBLIC_PATH = '/design/public'
export const PUBLIC_SEARCH_LIMIT = 120
export const PUBLIC_VIEWS = { home: '概览', pricing: '示例方案', faq: '常见问题', help: '使用帮助', updates: '更新日志' } as const
export type PublicView = keyof typeof PUBLIC_VIEWS
export type PublicCycle = 'monthly' | 'yearly'
export const PUBLIC_FEATURES = [
  { id: 'forms', icon: 'edit', title: '让输入有来有回', description: '从录入到提交，把校验、错误反馈与离开保护放进同一个流程。', to: '/components/form', link: '查看表单模式' },
  { id: 'board', icon: 'layers', title: '让协作进展可见', description: '任务有负责人、状态和下一步。看板支持拖动、菜单与键盘操作，不能移动时给出明确原因。', to: '/components/board', link: '查看协作看板' },
  { id: 'access', icon: 'lock', title: '让权限边界清楚', description: '同一份工作区，按角色呈现菜单、字段与操作。个人设置、用户调配和组织信息连成一条可操作的路径。界面负责解释权限，服务端负责验证每次请求。', to: '/design/access', link: '查看账号与权限' }
] as const
export const PUBLIC_PLANS = [
  { id: 'starter', name: '起步版', description: '适合展示一个清晰的入门选项。', monthlyCents: 0, yearlyCents: 0, benefits: ['基础页面示例', '公开帮助内容'] },
  { id: 'team', name: '团队版', description: '适合展示协作能力与方案差异。', monthlyCents: 9900, yearlyCents: 99000, benefits: ['起步版示例内容', '协作场景说明', '角色与组织模式'] },
  { id: 'scale', name: '扩展版', description: '适合展示较完整的能力组合。这里的功能与额度同样是排版示例，并非实际服务权益。', monthlyCents: 29900, yearlyCents: 299000, benefits: ['团队版示例内容', '复杂工作流说明', '集成方式示例', '管理与审计场景', '部署方式说明'] }
] as const
export const PUBLIC_FAQ = [
  { name: 'charge', title: '选择方案会产生费用吗？', content: '不会。本页的价格与权益都是虚构的排版示例。方案入口只打开说明，不创建订单、不收集支付信息，也不会发起扣款。' },
  { name: 'annual', title: '年付金额应该怎么看？', content: '年付展示整年的示例总额，并附按十二个月折算的参考月均金额。月均只用于比较，不能把它当作每月实际扣款金额。' },
  { name: 'theme', title: '可以切换颜色与明暗主题吗？', content: '可以。使用站点右上角的主题配置与明暗开关。页面沿用语义令牌，按钮底色与文字成对变化，内容层级还由标题、标签和图标表达。' },
  { name: 'reuse', title: '如何将页面模式接入自己的项目？', content: '先确认内容和导航结构，再复用已有组件。帮助文章、方案数据和查询规则集中维护；接入账号或交易服务时，应另外明确后端协议和权限边界。' }
] as const
export const PUBLIC_ARTICLES = [
  { id: 'getting-started', title: '从公共页面进入组件示例', category: '开始使用', summary: '了解导航、功能入口与浏览历史。', paragraphs: ['概览页介绍页面能力，功能卡片会进入对应的真实组件文档。返回浏览器上一页，可以回到公共页面继续查看。', '示例方案、常见问题、使用帮助和更新日志拥有独立的地址状态。刷新或分享地址后，仍能打开同一栏目和帮助文章。'] },
  { id: 'plans', title: '阅读示例方案与计价周期', category: '方案说明', summary: '区分年付总额与参考月均，不连接支付。', paragraphs: ['所有金额和权益都是虚构示例，仅用于验证方案卡片的展示。起步版、团队版和扩展版不对应实际可购买服务。', '按年查看时，醒目金额是全年示例总额。参考月均由年付总额除以十二并四舍五入到分。切换周期只改变显示和地址，不触发任何交易。'] },
  { id: 'theme', title: '调整明暗主题与阅读体验', category: '页面外观', summary: '通过主题配置验证文字、按钮与卡片。', paragraphs: ['点击站点明暗开关即可改变整页主题。主题配置还可以调整品牌色、字号和动效偏好。', '修改主题后要同时检查正文、按钮文字与弱化说明。窄屏下导航会换行，卡片随内容定高，正文保持适合连续阅读的行长。'] },
  { id: 'navigation', title: '找回文章与筛选结果', category: '使用帮助', summary: '搜索没有结果或地址失效时如何返回。', paragraphs: ['帮助搜索会匹配标题、摘要、分类和正文。用空格分开多个关键词时，结果需要同时匹配这些词。', '搜索词保存在地址中。打开文章后再返回帮助列表，会保留搜索条件；没有结果时可以清空搜索。失效文章会明确提示，并提供返回帮助的入口。'] }
] as const
export const PUBLIC_UPDATES = [
  { id: 'navigation', date: '2026-09-20', title: '导航与帮助示例', items: ['帮助支持关键词搜索与文章直达。', '页面栏目、计价周期与搜索条件随地址保存。'], article: 'navigation' },
  { id: 'appearance', date: '2026-09-18', title: '主题与方案示例', items: ['方案卡片展示按月和按年两种示例口径。', '公共页面使用共享颜色、字号和动效令牌。'], article: 'theme' }
] as const

export function publicPrice(plan: typeof PUBLIC_PLANS[number], cycle: PublicCycle) {
  const total = cycle === 'yearly' ? plan.yearlyCents : plan.monthlyCents
  return { amount: (total / 100).toFixed(2), period: cycle === 'yearly' ? '年' : '月',
    monthly: ((cycle === 'yearly' ? Math.round(total / 12) : total) / 100).toFixed(2) }
}
export function searchPublicHelp(query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return PUBLIC_ARTICLES.filter(article => {
    const text = [article.title, article.category, article.summary, ...article.paragraphs].join(' ').toLowerCase()
    return words.every(word => text.includes(word))
  })
}
export function publicRoute(query: Record<string, unknown>) {
  const view = query.view ?? 'home'
  const validView = typeof view === 'string' && Object.prototype.hasOwnProperty.call(PUBLIC_VIEWS, view)
  const articleId = typeof query.article === 'string' ? query.article : ''
  const article = PUBLIC_ARTICLES.find(item => item.id === articleId)
  return {
    view: validView ? view as PublicView : 'home' as PublicView,
    missingView: !validView,
    cycle: query.cycle === 'yearly' ? 'yearly' as const : 'monthly' as const,
    search: typeof query.q === 'string' ? query.q.slice(0, PUBLIC_SEARCH_LIMIT) : '',
    article,
    missingArticle: query.article !== undefined && !article
  }
}
/** 链接只允许站内固定路径，不接受外部重定向；空搜索不写入 URL。 */
export function publicLocation(view: PublicView, options: { cycle?: PublicCycle; article?: string; search?: string } = {}) {
  const query: Record<string, string> = { view }
  if (view === 'pricing' && options.cycle) query.cycle = options.cycle
  if (view === 'help') {
    if (options.article) query.article = options.article
    if (options.search?.trim()) query.q = options.search.trim().slice(0, PUBLIC_SEARCH_LIMIT)
  }
  return { path: PUBLIC_PATH, query }
}
