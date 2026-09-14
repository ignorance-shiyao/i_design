/**
 * 图标元数据：分类、中英文名与别名。
 *
 * 为什么必须有这一层：使用方脑子里想的是业务词——「删除」「回收站」「作废」，
 * 而图标叫 `trash`。没有别名表，他要么翻完整张表，要么自己画一个。
 * 图标库真正的可用性不在数量上，在「想得到的词能不能找到东西」。
 *
 * 分类沿用 4.2 的语义域。没有图标的语义域不隐藏，而是明确列成缺口——
 * 「还缺什么」和「现在有什么」一样重要，选型时卡住人的往往是前者。
 *
 * 这份表是手写的：中文名、别名、分类没法从 path 数据推出来。
 * 但它与图标本体的一致性由 check:icons 兜住——多一条、少一条、重名都会失败。
 */
import { icons, type IconName } from './index'

/** 语义域。顺序即图标浏览器里的分组顺序 */
export const ICON_CATEGORIES = [
  'action', 'direction', 'status', 'people', 'file', 'data',
  'flow', 'ai', 'device', 'commerce', 'finance', 'schedule',
  'media', 'map', 'dev', 'security', 'gesture', 'brand'
] as const

export type IconCategory = (typeof ICON_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<IconCategory, string> = {
  action: '通用操作',
  direction: '方向导航',
  status: '状态反馈',
  people: '用户 / 组织 / 权限',
  file: '文件格式',
  data: '表格 / 图表',
  flow: '流程节点与连线',
  ai: 'AI / 工具 / 模型',
  device: '设备 / 网络 / 云',
  commerce: '采购 / 销售 / 库存 / 物流',
  finance: '财务 / 合同',
  schedule: '日历 / 会议 / 协作',
  media: '媒体 / 编辑器',
  map: '地图 / 位置',
  dev: '开发 / 数据',
  security: '安全 / 审计',
  gesture: '移动手势',
  brand: '品牌 / 技术栈'
}

export interface IconMeta {
  /** 中文名，图标浏览器里显示的那个 */
  cn: string
  /** 英文名。与 id 不同时才写，比如 id 是缩写 */
  en?: string
  category: IconCategory
  /** 检索用的业务词：使用方想得到的说法，不是设计师的说法 */
  aliases?: readonly string[]
  /** 已弃用时指向替代品 */
  deprecatedBy?: IconName
}

export const iconMeta: Record<IconName, IconMeta> = {
  check: { cn: '对勾', category: 'action', aliases: ['完成', '成功', '选中', '确认', 'done', 'tick'] },
  close: { cn: '关闭', category: 'action', aliases: ['取消', '叉', '删掉', 'cancel', 'x'] },
  plus: { cn: '新增', category: 'action', aliases: ['添加', '加号', '新建', 'add', 'new'] },
  minus: { cn: '减少', category: 'action', aliases: ['移除', '减号', 'remove', 'subtract'] },
  search: { cn: '搜索', category: 'action', aliases: ['查找', '检索', '放大镜', 'find', 'magnifier'] },
  filter: { cn: '筛选', category: 'action', aliases: ['过滤', '条件', '漏斗', 'funnel'] },
  edit: { cn: '编辑', category: 'action', aliases: ['修改', '铅笔', '改单', 'modify', 'pencil'] },
  copy: { cn: '复制', category: 'action', aliases: ['拷贝', '副本', 'duplicate', 'clone'] },
  trash: { cn: '删除', category: 'action', aliases: ['回收站', '作废', '丢弃', 'delete'] },
  download: { cn: '下载', category: 'action', aliases: ['导出', '保存到本地', 'export', 'save'] },
  refresh: { cn: '刷新', category: 'action', aliases: ['重新加载', '重试', '同步', 'reload', 'retry', 'sync'] },
  undo: { cn: '撤销', category: 'action', aliases: ['回退', '后退一步', 'revert'] },
  redo: { cn: '重做', category: 'action', aliases: ['再来一次', 'redo'] },
  more: { cn: '更多', category: 'action', aliases: ['省略号', '更多操作', 'ellipsis', 'overflow'] },

  'chevron-up': { cn: '向上', category: 'direction', aliases: ['收起', '折叠', '上一个', 'collapse'] },
  'chevron-down': { cn: '向下', category: 'direction', aliases: ['展开', '下拉', '下一个', 'expand', 'dropdown'] },
  'chevron-left': { cn: '向左', category: 'direction', aliases: ['上一页', 'prev'] },
  'chevron-right': { cn: '向右', category: 'direction', aliases: ['下一页', '进入', '查看详情', 'next'] },
  'arrow-right': { cn: '右箭头', category: 'direction', aliases: ['前往', '跳转', '流向', 'goto'] },
  'arrow-left': { cn: '左箭头', category: 'direction', aliases: ['返回', '回到上一步', 'back'] },
  'external-link': { cn: '外部链接', category: 'direction', aliases: ['新窗口打开', '站外', 'new tab'] },

  'check-circle': { cn: '成功', category: 'status', aliases: ['通过', '已完成', '正常', 'success', 'passed'] },
  'info-circle': { cn: '提示', category: 'status', aliases: ['信息', '注释', 'info', 'note'] },
  'warning-triangle': { cn: '警告', category: 'status', aliases: ['注意', '风险', '待处理', 'warning', 'caution'] },
  'error-circle': { cn: '错误', category: 'status', aliases: ['失败', '异常', '驳回', 'error', 'failed', 'rejected'] },
  'help-circle': { cn: '帮助', category: 'status', aliases: ['疑问', '说明', '不懂', 'help', 'question'] },

  user: { cn: '用户', category: 'people', aliases: ['成员', '负责人', '账号', '申请人', 'person', 'account'] },

  folder: { cn: '文件夹', category: 'file', aliases: ['目录', '分组', 'directory'] },
  file: { cn: '文件', category: 'file', aliases: ['附件', '单据', 'attachment', 'document'] },
  'file-text': { cn: '文本文件', category: 'file', aliases: ['文档', 'txt', 'markdown'] },
  'file-image': { cn: '图片文件', category: 'file', aliases: ['图片', '截图', 'png', 'jpg', 'image'] },
  'file-sheet': { cn: '表格文件', category: 'file', aliases: ['电子表格', 'excel', 'xlsx', 'csv', '报表'] },
  'file-code': { cn: '代码文件', category: 'file', aliases: ['源码', 'json', 'ts', 'code file'] },
  'file-zip': { cn: '压缩包', category: 'file', aliases: ['zip', '归档', 'archive'] },
  'file-media': { cn: '音视频文件', category: 'file', aliases: ['视频', '音频', 'mp4', 'audio', 'video'] },

  grid: { cn: '网格', category: 'data', aliases: ['看板', '卡片视图', '矩阵', 'board'] },
  layers: { cn: '层级', category: 'data', aliases: ['堆叠', '分层', '批次', 'stack'] },
  ruler: { cn: '尺寸', category: 'data', aliases: ['刻度', '度量', '间距', 'size', 'spacing'] },
  'text-size': { cn: '字号', category: 'data', aliases: ['文字大小', '排版', 'font size'] },
  'corner-radius': { cn: '圆角', category: 'data', aliases: ['圆角半径', 'radius'] },
  'shadow-layer': { cn: '阴影', category: 'data', aliases: ['投影', '高度', 'shadow', 'elevation'] },
  palette: { cn: '调色板', category: 'data', aliases: ['配色', '主题色', '取色', 'theme', 'color'] },

  marquee: { cn: '框选', category: 'flow', aliases: ['选区', '拖选', 'selection'] },
  minimap: { cn: '缩略图', category: 'flow', aliases: ['导览图', '小地图', 'overview'] },

  sparkle: { cn: '智能', category: 'ai', aliases: ['AI', '生成', '建议', '推荐', 'magic', 'assistant'] },
  code: { cn: '代码', category: 'dev', aliases: ['开发', '片段', '调试', 'snippet'] },

  calendar: { cn: '日历', category: 'schedule', aliases: ['日期', '排期', '会议', 'date', 'schedule'] },
  clock: { cn: '时间', category: 'schedule', aliases: ['时刻', '耗时', '超时', '倒计时', 'time', 'duration'] },
  pin: { cn: '置顶', category: 'schedule', aliases: ['固定', '收藏', '标记', 'pin', 'sticky'] },

  menu: { cn: '菜单', category: 'media', aliases: ['导航', '汉堡', '侧栏', 'hamburger', 'nav'] },
  sun: { cn: '亮色主题', category: 'media', aliases: ['白天', '浅色', 'light'] },
  moon: { cn: '暗色主题', category: 'media', aliases: ['夜间', '深色', 'dark'] },

  server: { cn: '服务器', category: 'device', aliases: ['主机', '机房', '数据源', 'host'] },
  cloud: { cn: '云', category: 'device', aliases: ['云端', '云服务', 'cloud storage'] },
  network: { cn: '网络', category: 'device', aliases: ['联网', '在线', '全球', 'online', 'globe'] },
  offline: { cn: '断网', category: 'device', aliases: ['离线', '连接断开', 'disconnected'] },
  device: { cn: '设备', category: 'device', aliases: ['手机', '终端', '移动端', 'mobile', 'phone'] },
  printer: { cn: '打印', category: 'device', aliases: ['打印机', '出单', 'print'] },

  box: { cn: '货品', category: 'commerce', aliases: ['商品', '物料', 'SKU', '纸箱', 'product'] },
  warehouse: { cn: '仓库', category: 'commerce', aliases: ['库房', '库存地点', 'storage'] },
  truck: { cn: '发货', category: 'commerce', aliases: ['物流', '配送', '运输', 'shipping', 'logistics'] },
  cart: { cn: '采购', category: 'commerce', aliases: ['购物车', '下单', 'purchase'] },
  'stock-in': { cn: '入库', category: 'commerce', aliases: ['收货', '进货', 'inbound'] },
  'stock-out': { cn: '出库', category: 'commerce', aliases: ['发料', '领用', 'outbound'] },
  tag: { cn: '标签', category: 'commerce', aliases: ['价签', '分类标记', 'label'] },

  coin: { cn: '金额', category: 'finance', aliases: ['费用', '金钱', '价格', 'money', 'amount'] },
  invoice: { cn: '单据', category: 'finance', aliases: ['发票', '账单', 'bill', 'receipt'] },
  contract: { cn: '合同', category: 'finance', aliases: ['协议', '条款', 'agreement'] },
  wallet: { cn: '钱包', category: 'finance', aliases: ['账户', '余额', 'balance'] },
  'invoice-check': { cn: '单据已审', category: 'finance', aliases: ['报销通过', '已核销', 'approved bill'] },

  'map-pin': { cn: '位置', category: 'map', aliases: ['地点', '坐标', '定位', 'location', 'place'] },
  map: { cn: '地图', category: 'map', aliases: ['区域', '分布', 'region'] },
  route: { cn: '路线', category: 'map', aliases: ['路径', '走向', '流转', 'path'] },
  navigation: { cn: '导航', category: 'map', aliases: ['指向', '出发', 'navigate'] },

  shield: { cn: '安全', category: 'security', aliases: ['防护', '保护', 'protection'] },
  'shield-check': { cn: '已通过校验', category: 'security', aliases: ['安全检查', '合规', 'verified'] },
  lock: { cn: '锁定', category: 'security', aliases: ['加密', '受限', '私密', 'locked', 'private'] },
  unlock: { cn: '解锁', category: 'security', aliases: ['开放', '已授权', 'unlocked'] },
  key: { cn: '密钥', category: 'security', aliases: ['凭证', '权限', 'token', 'credential'] },
  eye: { cn: '查看', category: 'security', aliases: ['可见', '预览', '明文', 'visible', 'preview'] },
  'eye-off': { cn: '隐藏', category: 'security', aliases: ['不可见', '遮蔽', '脱敏', 'hidden', 'masked'] },
  history: { cn: '操作记录', category: 'security', aliases: ['审计', '历史', '版本记录', 'audit', 'log'] },

  tap: { cn: '点按', category: 'gesture', aliases: ['单击', '触摸', 'touch'] },
  swipe: { cn: '滑动', category: 'gesture', aliases: ['左右滑', '横滑', 'slide'] },
  'pinch-zoom': { cn: '双指缩放', category: 'gesture', aliases: ['捏合', '放大缩小', 'zoom'] },
  'long-press': { cn: '长按', category: 'gesture', aliases: ['按住', 'hold'] },

  github: { cn: 'GitHub', category: 'brand', aliases: ['仓库', 'repo'] }
}

/** 还没有任何图标的语义域。列出来而不是藏起来——「还缺什么」和「有什么」一样重要 */
export const missingCategories = (): IconCategory[] => {
  const covered = new Set(Object.values(iconMeta).map((m) => m.category))
  return ICON_CATEGORIES.filter((category) => !covered.has(category))
}

/**
 * 按业务词检索图标。
 *
 * 匹配 id、中文名、英文名与别名。排序把「整词命中」排在「部分命中」前面：
 * 搜「删除」时 trash 要排在「删除线」那类之前，否则第一眼看到的不是他要的那个。
 */
export function searchIcons(query: string): IconName[] {
  const text = query.trim().toLowerCase()
  if (!text) return Object.keys(iconMeta) as IconName[]
  const scored: { name: IconName; score: number }[] = []
  for (const [name, meta] of Object.entries(iconMeta) as [IconName, IconMeta][]) {
    const fields = [name, meta.cn, meta.en ?? '', ...(meta.aliases ?? [])].map((f) => f.toLowerCase())
    let score = 0
    for (const field of fields) {
      if (field === text) score = Math.max(score, 3)
      else if (field.startsWith(text)) score = Math.max(score, 2)
      else if (field.includes(text)) score = Math.max(score, 1)
    }
    if (score) scored.push({ name, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((hit) => hit.name)
}

/** 按语义域分组，供图标浏览器渲染 */
export function iconsByCategory(): { category: IconCategory; label: string; names: IconName[] }[] {
  return ICON_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    names: (Object.keys(iconMeta) as IconName[]).filter((name) => iconMeta[name].category === category)
  })).filter((group) => group.names.length > 0)
}

/** 图标本体是否与元数据一一对应。check:icons 用它，运行时不必调用 */
export function metaGaps(): { missingMeta: string[]; staleMeta: string[] } {
  const names = new Set(Object.keys(icons))
  const metaNames = new Set(Object.keys(iconMeta))
  return {
    missingMeta: [...names].filter((name) => !metaNames.has(name)).sort(),
    staleMeta: [...metaNames].filter((name) => !names.has(name)).sort()
  }
}
