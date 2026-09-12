import { implementationStatus } from './componentStatus'

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
const categoryDefinitions: (Omit<ComponentCategory, 'items'> & { items: Omit<ComponentMeta, 'status'>[] })[] = [
  {
    title: '基础',
    desc: '构成界面的最小交互单元。',
    items: [
      { name: 'Button', cn: '按钮', to: '/components/button', desc: '触发一个即时操作' },
      { name: 'Icon', cn: '图标', to: '/components/icon', desc: '跟随文字色的内联 SVG 图标' },
      { name: 'Tag', cn: '标签', to: '/components/tag', desc: '标记分类或状态' },
      { name: 'Divider', cn: '分割线', to: '/components/divider', desc: '分隔内容区块' },
      { name: 'Link', cn: '链接', to: '/components/link', desc: '跳转到另一个地址' },
      { name: 'StickyTool', cn: '侧边工具条', to: '/components/sticky-tool', desc: '贴边的一组快捷入口' },
      { name: 'FloatButton', cn: '悬浮操作按钮', to: '/components/float-button', desc: '页面角落的主操作入口' },
      { name: 'CodeBlock', cn: '代码块', to: '/components/code-block', desc: '高亮、行号与 diff 视图' },
      { name: 'CommandSearch', cn: '命令搜索', to: '/components/command-search', desc: '搜一下就到，键盘全程可用' },
      { name: 'Scrollbar', cn: '滚动条', to: '/components/scrollbar', desc: '不占布局的自绘滚动条' },
      { name: 'ConfigProvider', cn: '全局配置', to: '/components/config-provider', desc: '下发文案字典与默认尺寸' }
    ]
  },
  {
    title: '导航',
    desc: '在信息层级之间移动。',
    items: [
      { name: 'Tabs', cn: '标签页', to: '/components/tabs', desc: '切换并列的内容视图' },
      { name: 'Pagination', cn: '分页', to: '/components/pagination', desc: '把长列表切成可控片段' },
      { name: 'Breadcrumb', cn: '面包屑', to: '/components/breadcrumb', desc: '展示当前所处层级' },
      { name: 'Steps', cn: '步骤条', to: '/components/steps', desc: '引导用户完成多步任务' }
    ]
  },
  {
    title: '数据录入',
    desc: '采集用户输入，是中后台产品的主战场。',
    items: [
      { name: 'Input', cn: '输入框', to: '/components/input', desc: '单行文本输入' },
      { name: 'InputAdornment', cn: '输入前后缀', to: '/components/input-adornment', desc: '把固定的前后缀移出输入框' },
      { name: 'RangeInput', cn: '区间输入', to: '/components/range-input', desc: '一次填一个区间的两端' },
      { name: 'InputOtp', cn: '验证码输入', to: '/components/input-otp', desc: '分格填写一次性验证码' },
      { name: 'SelectInput', cn: '选择器外壳', to: '/components/select-input', desc: '自定义选择器的输入框外壳' },
      { name: 'Textarea', cn: '多行文本框', to: '/components/textarea', desc: '多行文本输入与字数统计' },
      { name: 'Select', cn: '下拉选择', to: '/components/select', desc: '从预设项中选择' },
      { name: 'Radio', cn: '单选框', to: '/components/radio', desc: '一组互斥选项中选一个' },
      { name: 'Checkbox', cn: '多选框', to: '/components/checkbox', desc: '一组选项中选多个' },
      { name: 'Switch', cn: '开关', to: '/components/switch', desc: '两个互斥状态间切换' },
      { name: 'Form', cn: '表单', to: '/components/form', desc: '布局、校验与提交' },
      { name: 'DatePicker', cn: '日期选择器', to: '/components/date-picker', desc: '选择日期' },
      { name: 'TimeSelect', cn: '时间下拉', to: '/components/time-select', desc: '在固定时间点里挑一个' },
      { name: 'Upload', cn: '上传', to: '/components/upload', desc: '上传文件与进度反馈' },
      { name: 'Cascader', cn: '级联选择', to: '/components/cascader', desc: '多级联动选择' },
      { name: 'TreeSelect', cn: '树选择', to: '/components/tree', desc: '在层级里选一项或多项' },
      { name: 'Slider', cn: '滑块', to: '/components/data-entry', desc: '在连续区间内取值' },
      { name: 'InputNumber', cn: '数字输入', to: '/components/data-entry', desc: '带步进与范围约束的数值' },
      { name: 'Rate', cn: '评分', to: '/components/data-entry', desc: '打分与半星' },
      { name: 'TagInput', cn: '输入标签', to: '/components/data-entry', desc: '回车成标签、粘贴批量拆分' },
      { name: 'AutoComplete', cn: '自动完成', to: '/components/data-entry', desc: '边输入边给候选' },
      { name: 'NumberKeypad', cn: '数字键盘', to: '/components/mobile', desc: '金额与验证码的触摸输入' },
      { name: 'TimePicker', cn: '时间选择器', to: '/components/data-entry', desc: '选择时刻或区间' },
      { name: 'Transfer', cn: '穿梭框', to: '/components/data-entry', desc: '在两栏之间移动条目' }
    ]
  },
  {
    title: '数据展示',
    desc: '把结构化数据呈现给用户。',
    items: [
      { name: 'Table', cn: '表格', to: '/components/table', desc: '行列数据与排序' },
      { name: 'Card', cn: '卡片', to: '/components/card', desc: '承载一组相关信息' },
      { name: 'Tooltip', cn: '文字提示', to: '/components/tooltip', desc: '悬浮时补充说明' },
      { name: 'Empty', cn: '空状态', to: '/components/empty', desc: '解释为何没有内容' },
      { name: 'Avatar', cn: '头像', to: '/components/avatar', desc: '展示用户或实体' },
      { name: 'Badge', cn: '徽标', to: '/components/badge', desc: '标记数量或状态点' },
      { name: 'Collapse', cn: '折叠面板', to: '/components/collapse', desc: '折叠次要内容' },
      { name: 'Tree', cn: '树', to: '/components/tree', desc: '展示层级结构' },
      { name: 'Carousel', cn: '走马灯', to: '/components/data-display', desc: '一组内容轮播，移动端即 Swiper' },
      { name: 'Countdown', cn: '倒计时', to: '/components/data-display', desc: '倒数到某个截止时刻' },
      { name: 'InfiniteScroll', cn: '无限滚动', to: '/components/mobile', desc: '翻到底自动续下一页' },
      { name: 'Descriptions', cn: '描述列表', to: '/components/descriptions', desc: '成组展示只读字段' },
      { name: 'Comment', cn: '评论', to: '/components/comment', desc: '展示一条讨论记录' },
      { name: 'ImageViewer', cn: '图片预览', to: '/components/image-viewer', desc: '全屏看大图，支持缩放与翻页' },
      { name: 'Qrcode', cn: '二维码', to: '/components/qrcode', desc: '把文本编成可扫的码' },
      { name: 'Skeleton', cn: '骨架屏', to: '/components/skeleton', desc: '加载中的内容占位' }
    ]
  },
  {
    title: '消息反馈',
    desc: '把系统状态告诉用户，按打断成本从低到高选择。',
    items: [
      { name: 'Alert', cn: '警告提示', to: '/components/alert', desc: '页面内的持续提示' },
      { name: 'Message', cn: '全局提示', to: '/components/message', desc: '操作结果的轻量反馈' },
      { name: 'Notification', cn: '通知', to: '/components/navigation', desc: '角落通知，可常驻并带操作' },
      { name: 'Popconfirm', cn: '气泡确认', to: '/components/popconfirm', desc: '就地确认轻量操作' },
      { name: 'Modal', cn: '对话框', to: '/components/modal', desc: '打断流程要求处理' },
      { name: 'Confirm', cn: '命令式确认框', to: '/components/modal', desc: '一次 await 问一句话' },
      { name: 'Drawer', cn: '抽屉', to: '/components/drawer', desc: '从边缘滑出的面板' },
      { name: 'Loading', cn: '加载中', to: '/components/loading', desc: '标识区域正在加载' },
      { name: 'Result', cn: '结果页', to: '/components/result', desc: '操作结果的整页反馈' }
    ]
  },
  {
    title: '图表',
    desc: '让数据自己说话。颜色按「它在表达什么」分工，而不是按好看程度挑。',
    items: [
      { name: 'Chart', cn: '折线 / 柱状 / 面积', to: '/components/chart', desc: '趋势与对比' },
      { name: 'ChartPie', cn: '饼图 / 环图', to: '/components/chart', desc: '构成占比' },
      { name: 'ChartScatter', cn: '散点 / 气泡', to: '/components/chart', desc: '相关性与离群点' },
      { name: 'ChartHeatmap', cn: '热力图', to: '/components/chart', desc: '二维密度' },
      { name: 'ChartRadar', cn: '雷达图', to: '/components/chart', desc: '多维度对比' },
      { name: 'ChartFunnel', cn: '漏斗图', to: '/components/chart', desc: '转化流失' },
      { name: 'ChartGauge', cn: '仪表盘', to: '/components/chart', desc: '单值与阈值' },
      { name: 'ChartBox', cn: '箱线图', to: '/components/chart', desc: '分布与离群点' },
      { name: 'ChartWaterfall', cn: '瀑布图', to: '/components/chart', desc: '增减归因' },
      { name: 'ChartSankey', cn: '桑基图', to: '/components/chart', desc: '流向与分流' },
      { name: 'ChartTreemap', cn: '矩形树图', to: '/components/chart', desc: '层级占比' },
      { name: 'ChartZoom', cn: '区间缩放', to: '/components/chart', desc: '长序列里挑一段看' },
      { name: 'ChartGantt', cn: '甘特图', to: '/components/chart', desc: '排期、依赖与逾期' },
      { name: 'ChartWordCloud', cn: '词云', to: '/components/chart', desc: '词频按字号编码' },
      { name: 'Sparkline', cn: '迷你图', to: '/components/data-display', desc: '嵌在文字里的趋势' }
    ]
  },
  {
    title: '流程图',
    desc: '审批链、状态机、数据流向——写成文字要读三遍，画成图一眼就懂。',
    items: [
      { name: 'Flow', cn: '流程画布', to: '/components/flow', desc: '拖拽、缩放、自动布局与撤销' },
      { name: 'Marquee', cn: '框选与批量移动', to: '/components/flow', desc: '整组一起走，撤销也算一次' },
      { name: 'Minimap', cn: '缩略图', to: '/components/flow', desc: '大图里点哪跳哪' },
      { name: 'Snapshot', cn: '快照导出', to: '/components/flow', desc: '导出整张图而不是当前视口' }
    ]
  },
  {
    title: 'AI 会话',
    desc: '智能体替你做事时，人在哪一步介入、看到什么、能否反悔。',
    items: [
      { name: 'ChatMessage', cn: '消息气泡', to: '/components/chat', desc: '流式输出与来源标注' },
      { name: 'PromptInput', cn: '输入台', to: '/components/chat', desc: '多行输入、附件与发送' },
      { name: 'ChatThinking', cn: '思考过程', to: '/components/chat', desc: '可展开的推理步骤' },
      { name: 'ChatToolCall', cn: '工具调用', to: '/components/chat', desc: '调用了什么、拿到什么' },
      { name: 'ToolChips', cn: '工具芯片', to: '/components/chat', desc: '一串调用压成一行行芯片' },
      { name: 'ApprovalCard', cn: '征求确认', to: '/components/chat', desc: '行动前的人类介入' },
      { name: 'AgentTasks', cn: '任务行', to: '/components/chat', desc: '任务的实时状态' },
      { name: 'RecommendCard', cn: '建议卡', to: '/components/chat', desc: '带置信度的主动建议' },
      { name: 'ContextCards', cn: '上下文卡', to: '/components/chat', desc: '检索到的片段与出处' },
      { name: 'DiffTable', cn: '差异表', to: '/components/chat', desc: '成批改动逐行采纳' }
    ]
  },
  {
    title: '移动端',
    desc: '触摸场景的特有形态：拇指够得到、手势说得通。',
    items: [
      { name: 'NavBar', cn: '导航栏', to: '/components/mobile', desc: '让出状态栏的顶栏' },
      { name: 'Tabbar', cn: '标签栏', to: '/components/mobile', desc: '常驻底部的页面切换' },
      { name: 'Popup', cn: '浮层', to: '/components/mobile', desc: '从边缘弹出的裸容器' },
      { name: 'ActionSheet', cn: '动作面板', to: '/components/mobile', desc: '底部弹出的操作列表' },
      { name: 'Cell', cn: '单元格', to: '/components/mobile', desc: '列表行与设置项' },
      { name: 'SwipeCell', cn: '滑动操作', to: '/components/mobile', desc: '左滑露出次级操作' },
      { name: 'SearchBar', cn: '搜索栏', to: '/components/mobile', desc: '移动尺度的搜索入口' },
      { name: 'Picker', cn: '选择器', to: '/components/mobile', desc: '滚轮式多列选择' },
      { name: 'NoticeBar', cn: '通告栏', to: '/components/mobile', desc: '与操作无关的广播' },
      { name: 'CountDown', cn: '倒计时', to: '/components/mobile', desc: '秒杀与验证码计时' },
      { name: 'NumberKeypad', cn: '数字键盘', to: '/components/mobile', desc: '金额与验证码输入' },
      { name: 'InfiniteScroll', cn: '无限滚动', to: '/components/mobile', desc: '翻到底自动续下一页' },
      { name: 'Tour', cn: '新手引导', to: '/components/overlay', desc: '分步指向界面上的关键位置' }
    ]
  }
]

// 文案与路由属于编辑信息；ready / planned 不允许人工填写。
export const componentCategories: ComponentCategory[] = categoryDefinitions.map((group) => ({
  ...group,
  items: group.items.map((item) => ({ ...item, status: implementationStatus(item.name) }))
}))

export const plannedCount = componentCategories
  .flatMap((c) => c.items)
  .filter((i) => i.status === 'planned').length

export const readyCount = componentCategories
  .flatMap((c) => c.items)
  .filter((i) => i.status === 'ready').length
