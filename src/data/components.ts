export interface ComponentMeta {
  name: string
  cn: string
  to: string
  desc: string
  /** 该组件是否已实现；规划中的项在总览页标灰，说明覆盖范围的边界 */
  status: 'ready' | 'planned'
}

export interface ComponentCategory {
  title: string
  desc: string
  items: ComponentMeta[]
}

/** 组件总览：按使用场景分类，与左侧文档导航共用同一份数据 */
export const componentCategories: ComponentCategory[] = [
  {
    title: '基础',
    desc: '构成界面的最小交互单元。',
    items: [
      { name: 'Button', cn: '按钮', to: '/components/button', desc: '触发一个即时操作', status: 'ready' },
      { name: 'Icon', cn: '图标', to: '/components/icon', desc: '38 个内联 SVG 图标', status: 'ready' },
      { name: 'Tag', cn: '标签', to: '/components/tag', desc: '标记分类或状态', status: 'ready' },
      { name: 'Divider', cn: '分割线', to: '/components/divider', desc: '分隔内容区块', status: 'ready' }
    ]
  },
  {
    title: '导航',
    desc: '在信息层级之间移动。',
    items: [
      { name: 'Tabs', cn: '标签页', to: '/components/tabs', desc: '切换并列的内容视图', status: 'ready' },
      { name: 'Pagination', cn: '分页', to: '/components/pagination', desc: '把长列表切成可控片段', status: 'ready' },
      { name: 'Breadcrumb', cn: '面包屑', to: '/components/breadcrumb', desc: '展示当前所处层级', status: 'ready' },
      { name: 'Steps', cn: '步骤条', to: '/components/steps', desc: '引导用户完成多步任务', status: 'ready' }
    ]
  },
  {
    title: '数据录入',
    desc: '采集用户输入，是中后台产品的主战场。',
    items: [
      { name: 'Input', cn: '输入框', to: '/components/input', desc: '单行文本输入', status: 'ready' },
      { name: 'Textarea', cn: '多行文本框', to: '/components/textarea', desc: '多行文本输入与字数统计', status: 'ready' },
      { name: 'Select', cn: '下拉选择', to: '/components/select', desc: '从预设项中选择', status: 'ready' },
      { name: 'Radio', cn: '单选框', to: '/components/radio', desc: '一组互斥选项中选一个', status: 'ready' },
      { name: 'Checkbox', cn: '多选框', to: '/components/checkbox', desc: '一组选项中选多个', status: 'ready' },
      { name: 'Switch', cn: '开关', to: '/components/switch', desc: '两个互斥状态间切换', status: 'ready' },
      { name: 'Form', cn: '表单', to: '/components/form', desc: '布局、校验与提交', status: 'ready' },
      { name: 'DatePicker', cn: '日期选择器', to: '/components/date-picker', desc: '选择日期', status: 'ready' },
      { name: 'Upload', cn: '上传', to: '/components/upload', desc: '上传文件与进度反馈', status: 'ready' },
      { name: 'Cascader', cn: '级联选择', to: '', desc: '多级联动选择', status: 'planned' },
      { name: 'TimePicker', cn: '时间选择器', to: '', desc: '选择时刻或区间', status: 'planned' },
      { name: 'Slider', cn: '滑块', to: '', desc: '在连续区间内取值', status: 'planned' },
      { name: 'Transfer', cn: '穿梭框', to: '', desc: '在两栏之间移动条目', status: 'planned' }
    ]
  },
  {
    title: '数据展示',
    desc: '把结构化数据呈现给用户。',
    items: [
      { name: 'Table', cn: '表格', to: '/components/table', desc: '行列数据与排序', status: 'ready' },
      { name: 'Card', cn: '卡片', to: '/components/card', desc: '承载一组相关信息', status: 'ready' },
      { name: 'Tooltip', cn: '文字提示', to: '/components/tooltip', desc: '悬浮时补充说明', status: 'ready' },
      { name: 'Empty', cn: '空状态', to: '/components/empty', desc: '解释为何没有内容', status: 'ready' },
      { name: 'Avatar', cn: '头像', to: '/components/avatar', desc: '展示用户或实体', status: 'ready' },
      { name: 'Badge', cn: '徽标', to: '/components/badge', desc: '标记数量或状态点', status: 'ready' },
      { name: 'Collapse', cn: '折叠面板', to: '/components/collapse', desc: '折叠次要内容', status: 'ready' },
      { name: 'Tree', cn: '树', to: '', desc: '展示层级结构', status: 'planned' },
      { name: 'Descriptions', cn: '描述列表', to: '/components/descriptions', desc: '成组展示只读字段', status: 'ready' },
      { name: 'Skeleton', cn: '骨架屏', to: '/components/skeleton', desc: '加载中的内容占位', status: 'ready' }
    ]
  },
  {
    title: '消息反馈',
    desc: '把系统状态告诉用户，按打断成本从低到高选择。',
    items: [
      { name: 'Alert', cn: '警告提示', to: '/components/alert', desc: '页面内的持续提示', status: 'ready' },
      { name: 'Modal', cn: '对话框', to: '/components/modal', desc: '打断流程要求处理', status: 'ready' },
      { name: 'Message', cn: '全局提示', to: '/components/message', desc: '操作结果的轻量反馈', status: 'ready' },
      { name: 'Drawer', cn: '抽屉', to: '/components/drawer', desc: '从边缘滑出的面板', status: 'ready' },
      { name: 'Loading', cn: '加载中', to: '/components/loading', desc: '标识区域正在加载', status: 'ready' },
      { name: 'Popconfirm', cn: '气泡确认', to: '/components/popconfirm', desc: '就地确认轻量操作', status: 'ready' },
      { name: 'Popover', cn: '气泡卡片', to: '/components/overlay', desc: '承载比文字提示更复杂的内容', status: 'ready' },
      { name: 'Dropdown', cn: '下拉菜单', to: '/components/overlay', desc: '收纳次级操作，自动避让视口边缘', status: 'ready' },
      { name: 'Tree', cn: '树形控件', to: '/components/tree', desc: '层级数据的展开、勾选与搜索', status: 'ready' },
      { name: 'Cascader', cn: '级联选择', to: '/components/cascader', desc: '逐级选择层级数据', status: 'ready' },
      { name: 'TreeSelect', cn: '树选择', to: '/components/tree', desc: '把树收进下拉面板里选', status: 'ready' },
      { name: 'Menu', cn: '导航菜单', to: '/components/navigation', desc: '侧栏多级入口，可收起为图标栏', status: 'ready' },
      { name: 'Anchor', cn: '页内锚点', to: '/components/navigation', desc: '章节跳转与跟随高亮', status: 'ready' },
      { name: 'Notification', cn: '通知', to: '/components/navigation', desc: '角落通知，可常驻并带操作', status: 'ready' },
      { name: 'ApprovalCard', cn: '征求确认', to: '/components/chat', desc: '智能体行动前的人类介入', status: 'ready' },
      { name: 'AgentTasks', cn: '任务行', to: '/components/chat', desc: '智能体任务的实时状态', status: 'ready' },
      { name: 'RecommendCard', cn: '建议卡', to: '/components/chat', desc: '带置信度的主动建议', status: 'ready' },
      { name: 'ContextCards', cn: '上下文卡', to: '/components/chat', desc: '检索到的片段与出处', status: 'ready' },
      { name: 'DiffTable', cn: '差异表', to: '/components/chat', desc: '成批改动逐行采纳', status: 'ready' },
      { name: 'Result', cn: '结果页', to: '/components/result', desc: '操作结果的整页反馈', status: 'ready' }
    ]
  }
]

export const plannedCount = componentCategories
  .flatMap((c) => c.items)
  .filter((i) => i.status === 'planned').length

export const readyCount = componentCategories
  .flatMap((c) => c.items)
  .filter((i) => i.status === 'ready').length
