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
      { name: 'Tag', cn: '标签', to: '/components/tag', desc: '标记分类或状态', status: 'ready' },
      { name: 'Divider', cn: '分割线', to: '', desc: '分隔内容区块', status: 'planned' }
    ]
  },
  {
    title: '导航',
    desc: '在信息层级之间移动。',
    items: [
      { name: 'Tabs', cn: '标签页', to: '/components/tabs', desc: '切换并列的内容视图', status: 'ready' },
      { name: 'Pagination', cn: '分页', to: '/components/pagination', desc: '把长列表切成可控片段', status: 'ready' },
      { name: 'Breadcrumb', cn: '面包屑', to: '', desc: '展示当前所处层级', status: 'planned' },
      { name: 'Steps', cn: '步骤条', to: '', desc: '引导用户完成多步任务', status: 'planned' }
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
      { name: 'Form', cn: '表单', to: '', desc: '布局、校验与提交', status: 'planned' },
      { name: 'DatePicker', cn: '日期选择器', to: '', desc: '选择日期或区间', status: 'planned' }
    ]
  },
  {
    title: '数据展示',
    desc: '把结构化数据呈现给用户。',
    items: [
      { name: 'Table', cn: '表格', to: '/components/table', desc: '行列数据与排序', status: 'ready' },
      { name: 'Card', cn: '卡片', to: '/components/card', desc: '承载一组相关信息', status: 'ready' },
      { name: 'Tooltip', cn: '文字提示', to: '', desc: '悬浮时补充说明', status: 'planned' },
      { name: 'Empty', cn: '空状态', to: '', desc: '解释为何没有内容', status: 'planned' }
    ]
  },
  {
    title: '消息反馈',
    desc: '把系统状态告诉用户，按打断成本从低到高选择。',
    items: [
      { name: 'Alert', cn: '警告提示', to: '/components/alert', desc: '页面内的持续提示', status: 'ready' },
      { name: 'Modal', cn: '对话框', to: '/components/modal', desc: '打断流程要求处理', status: 'ready' },
      { name: 'Message', cn: '全局提示', to: '', desc: '操作结果的轻量反馈', status: 'planned' },
      { name: 'Drawer', cn: '抽屉', to: '', desc: '从边缘滑出的面板', status: 'planned' },
      { name: 'Loading', cn: '加载中', to: '', desc: '标识区域正在加载', status: 'planned' }
    ]
  }
]

export const readyCount = componentCategories
  .flatMap((c) => c.items)
  .filter((i) => i.status === 'ready').length
