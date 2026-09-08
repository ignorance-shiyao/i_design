/**
 * 对照 Ant Design v5 组件总览的覆盖清单。
 *
 * 目的不是把 Ant Design 抄一遍——有些组件（ConfigProvider、App、Util）属于它的
 * 运行时机制而非视觉组件，有些（Watermark、QRCode）在中后台里出现的频率低到
 * 不值得占用维护成本。把「有」「没有」「不打算做」三种状态一起写出来，
 * 比让使用者自己去猜要诚实。
 *
 * status:
 *   ready    —— 已实现
 *   planned  —— 认为该做，尚未实现
 *   skipped  —— 有意不做，附理由
 */
export type AntdStatus = 'ready' | 'planned' | 'skipped'

export interface AntdItem {
  /** Ant Design 里的组件名 */
  antd: string
  /** 本体系对应的组件名；未实现时为空 */
  ours?: string
  status: AntdStatus
  /** skipped 时说明为什么不做 */
  note?: string
}

export interface AntdGroup {
  title: string
  items: AntdItem[]
}

export const antdCoverage: AntdGroup[] = [
  {
    title: '通用',
    items: [
      { antd: 'Button', ours: 'IButton', status: 'ready' },
      { antd: 'Icon', ours: 'IIcon', status: 'ready' },
      { antd: 'Typography', ours: 'ITypography', status: 'ready' },
      { antd: 'FloatButton', status: 'planned' }
    ]
  },
  {
    title: '布局',
    items: [
      { antd: 'Divider', ours: 'IDivider', status: 'ready' },
      { antd: 'Space', ours: 'ISpace', status: 'ready' },
      { antd: 'Grid', ours: 'IRow / ICol', status: 'ready' },
      { antd: 'Flex', status: 'skipped', note: 'ISpace 已覆盖同一批场景，再加一个只会让人纠结该用哪个' },
      { antd: 'Layout', status: 'planned' },
      { antd: 'Splitter', status: 'planned' }
    ]
  },
  {
    title: '导航',
    items: [
      { antd: 'Breadcrumb', ours: 'IBreadcrumb', status: 'ready' },
      { antd: 'Pagination', ours: 'IPagination', status: 'ready' },
      { antd: 'Steps', ours: 'ISteps', status: 'ready' },
      { antd: 'Tabs', ours: 'ITabs', status: 'ready' },
      { antd: 'Dropdown', status: 'planned' },
      { antd: 'Menu', status: 'planned' },
      { antd: 'Anchor', status: 'planned' }
    ]
  },
  {
    title: '数据录入',
    items: [
      { antd: 'Checkbox', ours: 'ICheckbox', status: 'ready' },
      { antd: 'DatePicker', ours: 'IDatePicker', status: 'ready' },
      { antd: 'Form', ours: 'IForm', status: 'ready' },
      { antd: 'Input', ours: 'IInput', status: 'ready' },
      { antd: 'Radio', ours: 'IRadio', status: 'ready' },
      { antd: 'Select', ours: 'ISelect', status: 'ready' },
      { antd: 'Switch', ours: 'ISwitch', status: 'ready' },
      { antd: 'Upload', ours: 'IUpload', status: 'ready' },
      { antd: 'InputNumber', ours: 'IInputNumber', status: 'ready' },
      { antd: 'Slider', ours: 'ISlider', status: 'ready' },
      { antd: 'Rate', ours: 'IRate', status: 'ready' },
      { antd: 'TimePicker', status: 'planned' },
      { antd: 'Cascader', status: 'planned' },
      { antd: 'TreeSelect', status: 'planned' },
      { antd: 'Transfer', status: 'planned' },
      { antd: 'AutoComplete', status: 'planned' },
      { antd: 'Mentions', status: 'planned' },
      { antd: 'ColorPicker', status: 'planned' }
    ]
  },
  {
    title: '数据展示',
    items: [
      { antd: 'Avatar', ours: 'IAvatar', status: 'ready' },
      { antd: 'Badge', ours: 'IBadge', status: 'ready' },
      { antd: 'Card', ours: 'ICard', status: 'ready' },
      { antd: 'Collapse', ours: 'ICollapse', status: 'ready' },
      { antd: 'Descriptions', ours: 'IDescriptions', status: 'ready' },
      { antd: 'Empty', ours: 'IEmpty', status: 'ready' },
      { antd: 'Table', ours: 'ITable', status: 'ready' },
      { antd: 'Tag', ours: 'ITag', status: 'ready' },
      { antd: 'Tooltip', ours: 'ITooltip', status: 'ready' },
      { antd: 'Statistic', ours: 'IStatistic', status: 'ready' },
      { antd: 'Timeline', ours: 'ITimeline', status: 'ready' },
      { antd: 'Segmented', ours: 'ISegmented', status: 'ready' },
      { antd: 'List', ours: 'IList', status: 'ready' },
      { antd: 'Popover', status: 'planned' },
      { antd: 'Tree', status: 'planned' },
      { antd: 'Image', status: 'planned' },
      { antd: 'Carousel', status: 'planned' },
      { antd: 'Calendar', status: 'planned' },
      { antd: 'Tour', status: 'planned' },
      { antd: 'QRCode', status: 'skipped', note: '二维码是一段编码算法，不属于设计体系的职责，交给专门的库更合适' }
    ]
  },
  {
    title: '反馈',
    items: [
      { antd: 'Alert', ours: 'IAlert', status: 'ready' },
      { antd: 'Drawer', ours: 'IDrawer', status: 'ready' },
      { antd: 'Message', ours: 'message()', status: 'ready' },
      { antd: 'Modal', ours: 'IModal', status: 'ready' },
      { antd: 'Popconfirm', ours: 'IPopconfirm', status: 'ready' },
      { antd: 'Result', ours: 'IResult', status: 'ready' },
      { antd: 'Skeleton', ours: 'ISkeleton', status: 'ready' },
      { antd: 'Spin', ours: 'ILoading', status: 'ready' },
      { antd: 'Progress', ours: 'IProgress', status: 'ready' },
      { antd: 'Notification', status: 'planned' },
      { antd: 'Watermark', status: 'planned' }
    ]
  },
  {
    title: '其他',
    items: [
      { antd: 'Affix', status: 'planned' },
      { antd: 'ConfigProvider', status: 'skipped', note: '主题由 CSS 变量驱动，换肤改的是令牌层，不需要再包一层运行时上下文' },
      { antd: 'App', status: 'skipped', note: '为解决 React 静态方法拿不到 context 的问题而生，本体系没有这个问题' }
    ]
  },
  {
    title: 'AI 会话（Ant Design X 对应）',
    items: [
      { antd: 'Bubble', ours: 'IChatMessage', status: 'ready' },
      { antd: 'Sender', ours: 'IPromptInput', status: 'ready' },
      { antd: 'Thoughtchain', ours: 'IChatThinking', status: 'ready' },
      { antd: 'Prompts', ours: 'IChatSuggestions', status: 'ready' },
      { antd: 'Conversations', status: 'planned' },
      { antd: 'Attachments', ours: 'IPromptInput 的附件区', status: 'ready' }
    ]
  }
]
