export interface NavItem {
  to: string
  label: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

/** 文档站左侧导航；分组与组件总览页保持一致 */
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
    title: '基础',
    items: [
      { to: '/components/button', label: 'Button 按钮' },
      { to: '/components/icon', label: 'Icon 图标' },
      { to: '/components/tag', label: 'Tag 标签' },
      { to: '/components/divider', label: 'Divider 分割线' }
    ]
  },
  {
    title: '导航',
    items: [
      { to: '/components/tabs', label: 'Tabs 标签页' },
      { to: '/components/breadcrumb', label: 'Breadcrumb 面包屑' },
      { to: '/components/steps', label: 'Steps 步骤条' },
      { to: '/components/pagination', label: 'Pagination 分页' }
    ]
  },
  {
    title: '数据录入',
    items: [
      { to: '/components/form', label: 'Form 表单' },
      { to: '/components/input', label: 'Input 输入框' },
      { to: '/components/textarea', label: 'Textarea 多行文本框' },
      { to: '/components/select', label: 'Select 下拉选择' },
      { to: '/components/date-picker', label: 'DatePicker 日期选择器' },
      { to: '/components/radio', label: 'Radio 单选框' },
      { to: '/components/checkbox', label: 'Checkbox 多选框' },
      { to: '/components/switch', label: 'Switch 开关' }
    ]
  },
  {
    title: '数据展示',
    items: [
      { to: '/components/table', label: 'Table 表格' },
      { to: '/components/card', label: 'Card 卡片' },
      { to: '/components/tooltip', label: 'Tooltip 文字提示' },
      { to: '/components/empty', label: 'Empty 空状态' }
    ]
  },
  {
    title: '消息反馈',
    items: [
      { to: '/components/alert', label: 'Alert 警告提示' },
      { to: '/components/message', label: 'Message 全局提示' },
      { to: '/components/modal', label: 'Modal 对话框' },
      { to: '/components/drawer', label: 'Drawer 抽屉' },
      { to: '/components/loading', label: 'Loading 加载中' }
    ]
  }
]
