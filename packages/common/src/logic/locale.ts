/**
 * 文案字典。
 *
 * 组件里那些用户看得见的固定字——「暂无数据」「加载中…」「共 12 条」——
 * 散落在各端各写一遍时，改一处要翻五个包，而且永远有一端漏掉。
 * 更要紧的是：写死的中文让这套组件只能用在中文产品里。
 *
 * 这里只管字典与合并规则，「怎么把字典送到组件手上」由各端自己决定
 * （Vue/React 用上下文、Flutter 用 InheritedWidget、小程序用模块级设置）。
 */

export interface Locale {
  /** 语言标记，如 zh-CN。给 lang 属性与读屏用 */
  name: string

  /* 空与加载 */
  empty: string
  /** 列表翻到底却一条都没有。与 empty 分开：一个是「没有数据」，一个是「翻完了」 */
  emptyContent: string
  loading: string
  loadMore: string
  loadFailed: string
  noMore: string

  /* 选择 */
  placeholder: string
  /** 日期选择器的占位。与通用占位分开：「请选择」放在日历上太含糊 */
  datePlaceholder: string
  selectAll: string
  search: string
  /** 树的搜索框。比泛泛的「搜索」具体，用户一眼知道搜的是节点不是整页 */
  searchNode: string
  noMatch: string
  clear: string

  /* 确认 */
  confirm: string
  cancel: string
  acknowledge: string
  /** 关闭键的无障碍名。读屏用户听到的就是这一句，不跟着字典走等于没翻译 */
  close: string
  retry: string
  copy: string
  copied: string

  /* 展开 */
  expand: string
  collapse: string

  /* 校验 */
  required: string
  invalidFormat: string


  /* 图表：数据表是图表的无障碍出口，它自己的按钮与表头也得跟着字典走 */
  /** 展开数据表的按钮 */
  chartTableShow: string
  /** 收起数据表的按钮 */
  chartTableHide: string
  /** 数据表的第一列表头 */
  chartCategory: string
  chartValue: string
  chartPercent: string
  /** 系列过多时合并出来的那一项 */
  chartOther: string

  /* AI 交互 */
  /** 重新生成。与 retry 分开：一个是失败后重来，一个是对结果不满意再来一次 */
  regenerate: string
  thinking: string
  toolInput: string
  toolError: string
  toolResult: string
  /** 工具芯片折叠起来的那部分：「还有 N 个」 */
  /** 输入台的占位与三个按钮：写死中文的话，换成英文字典后这一块会是唯一还说中文的地方 */
  promptPlaceholder: string
  attach: string
  send: string
  stopGenerating: string
  /** 移除某个附件的无障碍名。读屏用户听到的就是这一句 */
  removeAttachmentText: (name: string) => string
  toolMoreText: (count: number) => string
  /** 折叠部分里失败的次数。单独说是因为「共 10 次」把「全成」与「有一次失败」说成了一样 */
  toolFailedText: (count: number) => string

  /* 上传 */
  /**
   * 可接受的类型与大小上限那一句。
   *
   * 整句交给字典而不是在组件里拼：顿号、逗号与语序都是语言相关的，
   * 拼出来的英文会是「支持 PNG, JPG , 单个不超过 5 MB」这种半中半英的样子。
   */
  uploadHintText: (types: string[], maxSize: number) => string
  /** 类型不符时的提示。读者要知道的是「该给什么」，不是「你给错了」 */
  uploadRejectText: (types: string[]) => string
  /** 通配 MIME 对应的类别词 */
  fileKinds: { image: string; audio: string; video: string; text: string }

  /* 逐题确认 */
  next: string
  skip: string
  /** 预置选项之外的自填项 */
  otherOption: string


  /* 移动端专有 */
  /** 下拉刷新的三段提示 */
  pullToRefresh: string
  releaseToRefresh: string
  refreshing: string
  /** 悬浮新建按钮的无障碍名 */
  create: string
  /** 倒计时的单位字，如「3 天 12 时」 */
  dayUnit: string
  hourUnit: string
  minuteUnit: string
  secondUnit: string

  /** 分页的「共 N 条」。用函数而不是模板串：有的语言要按数量变形 */
  totalText: (total: number) => string
  /** 分页的「第 11-20 条 / 共 95 条」。整句交给字典，各语言的语序本来就不同 */
  rangeText: (from: number, to: number, total: number) => string

  /**
   * 空态的四种成因各配一句标题与一句说明。
   *
   * 「为什么空」比「空了」有用得多：搜不到要提示换关键词，没权限要指向管理员。
   * 这四对文案跟着字典走，否则换语言之后空态会是整个界面里唯一还在说中文的地方。
   */
  emptyPresets: Record<EmptyReason, { title: string; description: string }>
}

export type EmptyReason = 'empty' | 'search' | 'error' | 'permission'

/*
 * 中文与西文之间留一个空格，中文与中文之间不留。
 *
 * 「支持 PNG」是对的，「支持 图片」里那个空格是多的——它看起来像少了个字。
 * 拼中文句子时凡是要接一段可能是西文也可能是中文的内容，都得走这一步。
 */
const cjkGap = (text: string) => (/^[\u4e00-\u9fff]/.test(text) ? text : ` ${text}`)

export const zhCN: Locale = {
  name: 'zh-CN',
  empty: '暂无数据',
  emptyContent: '暂无内容',
  loading: '加载中…',
  loadMore: '加载更多',
  loadFailed: '加载失败，点击重试',
  noMore: '没有更多了',
  placeholder: '请选择',
  datePlaceholder: '请选择日期',
  selectAll: '全选',
  search: '搜索',
  searchNode: '搜索节点',
  noMatch: '无匹配选项',
  clear: '清除',
  confirm: '确定',
  cancel: '取消',
  acknowledge: '知道了',
  close: '关闭',
  retry: '重试',
  copy: '复制',
  copied: '已复制',
  expand: '展开',
  collapse: '收起',
  required: '此项必填',
  invalidFormat: '格式不正确',
  chartTableShow: '查看数据表',
  chartTableHide: '收起数据表',
  chartCategory: '类别',
  chartValue: '数值',
  chartPercent: '占比',
  chartOther: '其他',
  regenerate: '重新生成',
  thinking: '推理过程',
  toolInput: '入参',
  toolError: '错误',
  toolResult: '结果',
  promptPlaceholder: '问点什么…',
  attach: '附件',
  send: '发送',
  stopGenerating: '停止生成',
  removeAttachmentText: (name) => `移除 ${name}`,
  uploadHintText: (types, maxSize) =>
    [types.length ? `支持${cjkGap(types.join('、'))}` : '', maxSize ? `单个不超过 ${maxSize} MB` : '']
      .filter(Boolean)
      .join('，'),
  uploadRejectText: (types) => `只接受${cjkGap(types.join('、'))}`,
  fileKinds: { image: '图片', audio: '音频', video: '视频', text: '文本' },
  toolMoreText: (count) => `还有 ${count} 个`,
  toolFailedText: (count) => `${count} 个失败`,
  next: '下一题',
  skip: '跳过',
  otherOption: '其他',
  pullToRefresh: '下拉刷新',
  releaseToRefresh: '松手即可刷新',
  refreshing: '正在刷新',
  create: '新建',
  dayUnit: '天',
  hourUnit: '时',
  minuteUnit: '分',
  secondUnit: '秒',
  totalText: (total) => `共 ${total} 条`,
  rangeText: (from, to, total) => `第 ${from}-${to} 条 / 共 ${total} 条`,
  emptyPresets: {
    empty: { title: '暂无数据', description: '这里还没有内容，创建第一条试试。' },
    search: { title: '没有匹配结果', description: '换个关键词，或减少筛选条件。' },
    error: { title: '加载失败', description: '请检查网络后重试。' },
    permission: { title: '无访问权限', description: '请联系管理员申请该资源的访问权限。' }
  }
}

export const enUS: Locale = {
  name: 'en-US',
  empty: 'No data',
  emptyContent: 'Nothing here yet',
  loading: 'Loading…',
  loadMore: 'Load more',
  loadFailed: 'Failed to load, tap to retry',
  noMore: 'No more items',
  placeholder: 'Select',
  datePlaceholder: 'Pick a date',
  selectAll: 'Select all',
  search: 'Search',
  searchNode: 'Search nodes',
  noMatch: 'No matches',
  clear: 'Clear',
  confirm: 'OK',
  cancel: 'Cancel',
  acknowledge: 'Got it',
  close: 'Close',
  retry: 'Retry',
  copy: 'Copy',
  copied: 'Copied',
  expand: 'Expand',
  collapse: 'Collapse',
  required: 'This field is required',
  invalidFormat: 'Invalid format',
  chartTableShow: 'Show data table',
  chartTableHide: 'Hide data table',
  chartCategory: 'Category',
  chartValue: 'Value',
  chartPercent: 'Share',
  chartOther: 'Other',
  regenerate: 'Regenerate',
  thinking: 'Reasoning',
  toolInput: 'Input',
  toolError: 'Error',
  toolResult: 'Result',
  promptPlaceholder: 'Ask anything…',
  attach: 'Attach',
  send: 'Send',
  stopGenerating: 'Stop generating',
  removeAttachmentText: (name) => `Remove ${name}`,
  uploadHintText: (types, maxSize) =>
    [types.length ? `Accepts ${types.join(', ')}` : '', maxSize ? `up to ${maxSize} MB each` : '']
      .filter(Boolean)
      .join('; '),
  uploadRejectText: (types) => `Only ${types.join(', ')} accepted`,
  fileKinds: { image: 'images', audio: 'audio', video: 'video', text: 'text files' },
  toolMoreText: (count) => `${count} more`,
  toolFailedText: (count) => `${count} failed`,
  next: 'Next',
  skip: 'Skip',
  otherOption: 'Other',
  pullToRefresh: 'Pull to refresh',
  releaseToRefresh: 'Release to refresh',
  refreshing: 'Refreshing',
  create: 'New',
  dayUnit: 'd',
  hourUnit: 'h',
  minuteUnit: 'm',
  secondUnit: 's',
  totalText: (total) => `${total} item${total === 1 ? '' : 's'}`,
  rangeText: (from, to, total) => `${from}-${to} of ${total}`,
  emptyPresets: {
    empty: { title: 'No data', description: 'Nothing here yet — create the first one.' },
    search: { title: 'No matches', description: 'Try another keyword, or drop a filter.' },
    error: { title: 'Failed to load', description: 'Check your connection and try again.' },
    permission: { title: 'No access', description: 'Ask an administrator for access to this resource.' }
  }
}

/**
 * 把局部覆盖合并到一份完整字典上。
 *
 * 缺的键回落到 base 而不是显示成空串或键名：接入方十有八九只想改两三句话
 * （把「暂无数据」换成「这个筛选条件下没有工单」），不该逼他们抄一整份字典，
 * 也不该因为抄漏了一个键就在界面上开天窗。
 *
 * base 默认中文而不是英文：这套组件的默认语言是中文，覆盖式接入时
 * 没提到的那些句子应当维持原样，而不是突然冒出几句英文。
 *
 * empty 会顺带改掉空态那一句标题。这两处说的是同一件事，只是长短不同：
 * empty 是列表、下拉里那一行短字，emptyPresets.empty.title 是整块空态的大标题。
 * 只改了 empty 却发现空态还写着「暂无数据」，接入方会以为覆盖没生效——
 * 而真要分开写时，把 emptyPresets 一并传进来即可，那时以传进来的为准。
 */
export function resolveLocale(overrides: Partial<Locale> = {}, base: Locale = zhCN): Locale {
  const merged = { ...base, ...overrides }
  if (overrides.empty && !overrides.emptyPresets) {
    merged.emptyPresets = {
      ...merged.emptyPresets,
      empty: { ...merged.emptyPresets.empty, title: overrides.empty }
    }
  }
  return merged
}
