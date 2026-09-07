export interface NavItem {
  to: string
  label: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

/** 文档站左侧导航；新增组件文档时在此追加一项 */
export const docNav: NavGroup[] = [
  {
    title: '设计',
    items: [
      { to: '/design/values', label: '设计价值观' },
      { to: '/design/tokens', label: '设计令牌' }
    ]
  },
  {
    title: '开始',
    items: [{ to: '/components', label: '组件总览' }]
  },
  {
    title: '通用',
    items: [
      { to: '/components/button', label: 'Button 按钮' },
      { to: '/components/tag', label: 'Tag 标签' },
      { to: '/components/tabs', label: 'Tabs 标签页' }
    ]
  },
  {
    title: '数据录入',
    items: [
      { to: '/components/input', label: 'Input 输入框' },
      { to: '/components/textarea', label: 'Textarea 多行文本框' },
      { to: '/components/radio', label: 'Radio 单选框' },
      { to: '/components/checkbox', label: 'Checkbox 多选框' },
      { to: '/components/select', label: 'Select 下拉选择' },
      { to: '/components/switch', label: 'Switch 开关' }
    ]
  },
  {
    title: '数据展示与反馈',
    items: [
      { to: '/components/card', label: 'Card 卡片' },
      { to: '/components/table', label: 'Table 表格' },
      { to: '/components/pagination', label: 'Pagination 分页' },
      { to: '/components/alert', label: 'Alert 警告提示' },
      { to: '/components/modal', label: 'Modal 对话框' }
    ]
  }
]
