import { implementationStatus } from './componentStatus'

/**
 * 组件全景：本设计体系提供哪些能力、按什么场景组织、哪些还在规划中。
 *
 * 三种状态一起写出来，而不是只列已有的：使用者选型时真正想知道的是
 * 「我要的东西这里有没有」，以及「没有的是暂时没做，还是根本不打算做」。
 * 明确不做的也写清理由，免得反复来问。
 */
export type CatalogStatus = 'ready' | 'planned' | 'excluded'

export interface CatalogItem {
  /** 中文名，按它解决的问题命名 */
  label: string
  /** 稳定的组件标识；规划项也预留标识，用于检查源码是否已落地 */
  api?: string
  status: CatalogStatus
  /** 一句话说明它解决什么问题；excluded 时说明为什么不做 */
  note?: string
}

export interface CatalogGroup {
  title: string
  /** 这一类在什么时候用 */
  intent: string
  items: CatalogItem[]
}

type CatalogDefinition = Omit<CatalogItem, 'status'> & { api: string; status?: 'excluded' }

const catalogDefinitions: (Omit<CatalogGroup, 'items'> & { items: CatalogDefinition[] })[] = [
  {
    title: '基础',
    intent: '任何界面都会用到的最小单位：动作、标识与文字本身。',
    items: [
      { label: '按钮', api: 'IButton', note: '触发一个即时操作，视觉层级区分主次' },
      { label: '图标', api: 'IIcon', note: '统一网格与描边的线性图标，跟随文字色' },
      { label: '文字排版', api: 'ITypography', note: '标题、正文与辅助文字的层级' },
      { label: '标签', api: 'ITag', note: '标记状态或分类' },
      { label: '徽标', api: 'IBadge', note: '未读数与状态点' },
      { label: '悬浮操作按钮', api: 'IFloatButton', note: 'Web 端常驻主操作入口；移动端已有 IFab' }
    ]
  },
  {
    title: '布局',
    intent: '把内容摆正：间距、栅格与页面骨架。',
    items: [
      { label: '间距', api: 'ISpace', note: '相邻元素的等距排列，间距只能取自令牌' },
      { label: '栅格', api: 'IRow / ICol', note: '24 栅格，窄屏自动整栏铺满' },
      { label: '分割线', api: 'IDivider', note: '划分内容段落' },
      { label: '页面框架', api: 'ILayout', note: '顶栏、侧栏与内容区的整页骨架' },
      { label: '可拖拽分栏', api: 'ISplitter', note: '左右两栏之间可拖动的分隔' },
      {
        label: '弹性容器',
        api: 'IFlex',
        status: 'excluded',
        note: '间距组件已覆盖同一批场景，再加一个只会让人纠结该用哪个'
      }
    ]
  },
  {
    title: '导航',
    intent: '让用户知道自己在哪、能去哪、怎么回来。',
    items: [
      { label: '标签页', api: 'ITabs', note: '在同一层级的几块内容之间切换' },
      { label: '面包屑', api: 'IBreadcrumb', note: '展示当前位置在层级中的路径' },
      { label: '步骤条', api: 'ISteps', note: '描述一个尚未走完的流程' },
      { label: '分页', api: 'IPagination', note: '长列表分段浏览' },
      { label: '分段控制器', api: 'ISegmented', note: '切换同一块区域内的数据视角' },
      { label: '下拉菜单', api: 'IDropdown', note: '收纳次级操作，自动避让视口边缘' },
      { label: '导航菜单', api: 'IMenu', note: '多级入口，选中项祖先自动展开' },
      { label: '页内锚点', api: 'IAnchor', note: '章节跳转，触底自动选中末节' }
    ]
  },
  {
    title: '数据录入',
    intent: '收集用户输入，并在出错之前把规则讲清楚。',
    items: [
      { label: '表单', api: 'IForm / IFormItem', note: '标签、控件与校验提示的排布' },
      { label: '输入框', api: 'IInput', note: '单行文本' },
      { label: '多行文本框', api: 'ITextarea', note: '多行文本与字数限制' },
      { label: '数字输入', api: 'IInputNumber', note: '步进、精度与边界都受控' },
      { label: '下拉选择', api: 'ISelect', note: '从一组预设项中选择' },
      { label: '日期选择', api: 'IDatePicker', note: '月历面板，可限定可选范围' },
      { label: '单选框', api: 'IRadio', note: '一组互斥选项' },
      { label: '多选框', api: 'ICheckbox', note: '多选与半选态' },
      { label: '开关', api: 'ISwitch', note: '立即生效的二元状态' },
      { label: '滑块', api: 'ISlider', note: '在连续区间里取值' },
      { label: '评分', api: 'IRate', note: '整星或半星打分' },
      { label: '上传', api: 'IUpload', note: '文件选择、进度与失败重试' },
      { label: '时间选择', api: 'ITimePicker', note: '时分秒的选择与范围' },
      { label: '级联选择', api: 'ICascader', note: '逐级选择，换列时右侧自动收起' },
      { label: '树形选择', api: 'ITreeSelect', note: '把树收进下拉面板，支持单选与多选' },
      { label: '穿梭框', api: 'ITransfer', note: '在两栏之间搬运条目' },
      { label: '自动完成', api: 'IAutoComplete', note: '边输入边给候选' },
      { label: '提及', api: 'IMentions', note: '输入 @ 时唤起人员候选' },
      { label: '颜色选择', api: 'IColorPicker', note: '取色与预设色板' }
    ]
  },
  {
    title: '数据展示',
    intent: '把已有的信息组织好，让人一眼看懂。',
    items: [
      { label: '表格', api: 'ITable', note: '横向比较多个字段，支持排序' },
      { label: '列表', api: 'IList', note: '逐条阅读，字段少而说明多' },
      { label: '卡片', api: 'ICard', note: '一块可独立理解的内容' },
      { label: '描述列表', api: 'IDescriptions', note: '成对的字段名与值' },
      { label: '折叠面板', api: 'ICollapse', note: '收起次要内容，保留入口' },
      { label: '统计数值', api: 'IStatistic', note: '突出一个关键数字与同比' },
      { label: '时间线', api: 'ITimeline', note: '记录已经发生的事' },
      { label: '头像', api: 'IAvatar / IAvatarGroup', note: '人员标识，无图时取字' },
      { label: '文字提示', api: 'ITooltip', note: '补充一句简短说明' },
      { label: '空状态', api: 'IEmpty', note: '没有数据时给出下一步' },
      { label: '气泡卡片', api: 'IPopover', note: '承载比文字提示更复杂的内容' },
      { label: '树形控件', api: 'ITree', note: '展开、父子联动勾选、半选与搜索' },
      { label: '图片预览', api: 'IImageViewer', note: '点击放大、缩放与切换' },
      { label: '走马灯', api: 'ICarousel', note: '同一位置轮播多屏内容' },
      { label: '日历', api: 'ICalendar', note: '按月查看与标记日程' },
      { label: '新手引导', api: 'ITour', note: '分步指向界面上的关键位置' },
      {
        label: '二维码',
        api: 'IQrcode',
        note: '把文本编码为可扫描的二维码，支持纠错等级与尺寸配置'
      }
    ]
  },
  {
    title: '数据可视化',
    intent: '让数字自己说话：趋势、构成、占比与流程走向。',
    items: [
      { label: '折线 / 面积 / 柱状图', api: 'IChart', note: '趋势与构成，带十字线、图例与数据表' },
      { label: '占比图', api: 'IChartPie', note: '环形，数值随图例给出' },
      { label: '迷你走势', api: 'ISparkline', note: '嵌在指标卡或表格行里的形状' },
      { label: '流程图', api: 'IFlow', note: '可拖拽的节点与连线，自动分层' },
      { label: '漏斗图', api: 'IChartFunnel', note: '转化各环节的流失与环比' },
      { label: '仪表盘', api: 'IChartGauge', note: '单值相对阈值的位置' },
      { label: '雷达图', api: 'IChartRadar', note: '多维度能力的形状对比' },
      { label: '热力图', api: 'IChartHeatmap', note: '二维密度，如按小时分布' },
      { label: '散点图', api: 'IChartScatter', note: '两个连续量之间的关系；系列数受配色校验约束' }
    ]
  },
  {
    title: '反馈',
    intent: '操作之后告诉用户发生了什么，以及接下来该做什么。',
    items: [
      { label: '警告提示', api: 'IAlert', note: '常驻在页面里的提示条' },
      { label: '全局提示', api: 'message()', note: '一句话反馈，自动消失' },
      { label: '对话框', api: 'IModal', note: '需要用户确认才能继续' },
      { label: '抽屉', api: 'IDrawer', note: '从边缘滑出的次级面板' },
      { label: '气泡确认', api: 'IPopconfirm', note: '就地确认一次轻量操作' },
      { label: '结果页', api: 'IResult', note: '一段流程结束后的反馈' },
      { label: '加载中', api: 'ILoading', note: '等待中的占位与遮罩' },
      { label: '骨架屏', api: 'ISkeleton', note: '首屏加载时的结构预览' },
      { label: '进度', api: 'IProgress', note: '线形与环形，可表示未知进度' },
      { label: '通知', api: 'notification', note: '角落常驻，带操作时不自动关闭' },
      { label: '水印', api: 'IWatermark', note: '页面级的防泄露标记' }
    ]
  },
  {
    title: 'AI 会话',
    intent: '把模型对话嵌进产品里，而不是另起一套皮肤。',
    items: [
      { label: '会话消息', api: 'IChatMessage', note: '用户与助手的消息、流式输出与重试' },
      { label: '输入台', api: 'IPromptInput', note: '自增高输入、附件、发送与中断' },
      { label: '推理过程', api: 'IChatThinking', note: '默认折叠的思考过程' },
      { label: '工具调用', api: 'IChatToolCall', note: '调用的名称、入参、结果与失败原因' },
      { label: '引用来源', api: 'IChatSources', note: '回答依据，编号与正文角标对应' },
      { label: '追问建议', api: 'IChatSuggestions', note: '对本轮回答的延伸提问' },
      { label: '等待提示', api: 'IChatTyping', note: '首个字符到达前的空窗' },
      { label: '会话列表', api: 'IChatList', note: '多轮会话的切换与管理' }
    ]
  },
  {
    title: '移动端专有',
    intent: '触屏上成立、桌面上不成立的那些形态。',
    items: [
      { label: '列表单元格', api: 'ICell', note: '移动端最常见的一行' },
      { label: '动作面板', api: 'IActionSheet', note: '从底部升起的一组操作' },
      { label: '轻提示', api: 'IToast', note: '不打断操作的短反馈' },
      { label: '顶部导航栏', api: 'INavBar', note: '标题居中，返回在左，操作在右' },
      { label: '底部标签栏', api: 'ITabbar', note: '切换整个页面，带角标与红点' },
      { label: '通告栏', api: 'INoticeBar', note: '与操作无关的广播，超长自动滚动' },
      { label: '边缘浮层', api: 'IPopup', note: '从四边或中心弹出的裸容器' },
      { label: '宫格入口', api: 'IGrid', note: '首页的功能入口区' },
      { label: '左滑单元格', api: 'ISwipeCell', note: '滑动露出操作，删除不应只有这一个入口' },
      { label: '吸顶', api: 'ISticky', note: '滚动到边界后固定' }
    ]
  }
]

// 两页保留不同的场景说明，但实现状态必须来自同一份源码清单。
export const componentCatalog: CatalogGroup[] = catalogDefinitions.map((group) => ({
  ...group,
  items: group.items.map((item) => ({
    ...item,
    status: item.status ?? implementationStatus(item.api)
  }))
}))
