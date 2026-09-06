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
    title: '通用',
    items: [
      { to: '/components/button', label: 'Button 按钮' },
      { to: '/components/tag', label: 'Tag 标签' }
    ]
  },
  {
    title: '数据录入',
    items: [
      { to: '/components/input', label: 'Input 输入框' },
      { to: '/components/switch', label: 'Switch 开关' }
    ]
  },
  {
    title: '数据展示与反馈',
    items: [
      { to: '/components/card', label: 'Card 卡片' },
      { to: '/components/alert', label: 'Alert 警告提示' }
    ]
  }
]
