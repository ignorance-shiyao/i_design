/**
 * 示例应用登记表（astra.md 的 G02）。
 *
 * 门户、应用之间的互跳、文档站的示例入口都读这一份：写三处必然会有一处漏，
 * 而漏掉的那处会变成死链——「点开是 404」比「没有入口」更糟。
 *
 * status 如实写：planned 的应用在门户上显示为「规划中」且不给链接，
 * 而不是给一个点进去是空白页的入口。
 */
export interface ExampleApp {
  id: string
  name: string
  /** 一句话说清它演示的是什么闭环 */
  summary: string
  /** 构建出来的子路径，相对门户 */
  path: string
  /** 仓库内的源码目录，文档站与应用内的「看源码」都指它 */
  source: string
  status: 'ready' | 'planned'
  /** 这个应用重点演示的能力，门户上按它分组 */
  topics: string[]
}

export const exampleApps: ExampleApp[] = [
  {
    id: 'erp',
    name: 'ERP 销售单',
    summary: '订单列表 → 新建 → 详情 → 状态流转，含 403 / 409 / 重复提交的真实分支',
    path: '../erp/',
    source: 'examples/erp',
    status: 'ready',
    topics: ['查询筛选', '表格', '表单', '状态机']
  },
  {
    id: 'oa',
    name: 'OA 审批',
    summary: '提交申请 → 待办审批 → 退回再提交 → 通知，申请人不能审批自己的单据',
    path: '../oa/',
    source: 'examples/oa',
    status: 'planned',
    topics: ['审批链', '通知', '角色']
  },
  {
    id: 'analytics',
    name: 'Analytics 分析台',
    summary: '图表探索、联动下钻、报告导出与实时监控的断流标注',
    path: '../analytics/',
    source: 'examples/analytics',
    status: 'planned',
    topics: ['图表', '联动', '实时']
  },
  {
    id: 'agent-studio',
    name: 'Agent Studio',
    summary: '销售问题 → 工具结果 → 人类确认 → 产物，取消与失败都可重放',
    path: '../agent-studio/',
    source: 'examples/agent-studio',
    status: 'planned',
    topics: ['对话', '工具', '可重放']
  },
  {
    id: 'mobile-workbench',
    name: '移动工作台',
    summary: '触摸端的单据处理，用移动端包而不是把桌面页面缩小',
    path: '../mobile-workbench/',
    source: 'examples/mobile-workbench',
    status: 'planned',
    topics: ['触摸', '离线', '安全区']
  }
]

export const readyApps = () => exampleApps.filter((a) => a.status === 'ready')

export const appById = (id: string) => exampleApps.find((a) => a.id === id)

/** 仓库地址由构建注入；没注入时退回仓库内相对路径，而不是拼一个可能不存在的域名 */
export const sourceUrl = (app: ExampleApp, repoBase = '') =>
  repoBase ? `${repoBase.replace(/\/$/, '')}/${app.source}` : app.source
