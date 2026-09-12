/// 文案字典（对应 packages/common/src/logic/locale.ts）。
///
/// 组件里那些用户看得见的固定字散落在各端各写一遍时，改一处要翻五个包，
/// 而且永远有一端漏掉。更要紧的是：写死的中文让这套组件只能用在中文产品里。
library;

enum IEmptyReason { empty, search, error, permission }

class IEmptyPreset {
  final String title;
  final String description;
  const IEmptyPreset({required this.title, required this.description});
}

class ILocale {
  /// 语言标记，如 zh-CN
  final String name;

  final String empty;

  /// 列表翻到底却一条都没有。与 empty 分开：一个是「没有数据」，一个是「翻完了」
  final String emptyContent;
  final String loading;
  final String loadMore;
  final String loadFailed;
  final String noMore;

  final String placeholder;

  /// 日期选择器的占位。与通用占位分开：「请选择」放在日历上太含糊
  final String datePlaceholder;
  final String selectAll;
  final String search;

  /// 树的搜索框。比泛泛的「搜索」具体，用户一眼知道搜的是节点不是整页
  final String searchNode;
  final String noMatch;
  final String clear;

  final String confirm;
  final String cancel;
  final String acknowledge;

  /// 关闭键的无障碍名。读屏用户听到的就是这一句，不跟着字典走等于没翻译
  final String close;
  final String retry;
  final String copy;
  final String copied;

  final String expand;
  final String collapse;

  final String required;
  final String invalidFormat;


  /* 图表的数据表、AI 交互与逐题确认 */
  final String chartTableShow;
  final String chartTableHide;
  final String chartCategory;
  final String chartValue;
  final String chartPercent;
  final String chartOther;
  final String regenerate;
  final String thinking;
  final String toolInput;
  final String toolError;
  final String toolResult;
  final String next;
  final String skip;
  final String otherOption;


  /* 移动端专有：下拉刷新、新建与倒计时单位 */
  final String pullToRefresh;
  final String releaseToRefresh;
  final String refreshing;
  final String create;
  final String dayUnit;
  final String hourUnit;
  final String minuteUnit;
  final String secondUnit;

  /// 分页的「共 N 条」。用函数而不是模板串：有的语言要按数量变形
  final String Function(int total) totalText;

  /// 分页的「第 11-20 条 / 共 95 条」。整句交给字典，各语言的语序本来就不同
  final String Function(int from, int to, int total) rangeText;

  /// 空态的四种成因各配一句标题与一句说明。
  ///
  /// 「为什么空」比「空了」有用得多：搜不到要提示换关键词，没权限要指向管理员。
  final Map<IEmptyReason, IEmptyPreset> emptyPresets;

  const ILocale({
    required this.name,
    required this.empty,
    required this.emptyContent,
    required this.loading,
    required this.loadMore,
    required this.loadFailed,
    required this.noMore,
    required this.placeholder,
    required this.datePlaceholder,
    required this.selectAll,
    required this.search,
    required this.searchNode,
    required this.noMatch,
    required this.clear,
    required this.confirm,
    required this.cancel,
    required this.acknowledge,
    required this.close,
    required this.retry,
    required this.copy,
    required this.copied,
    required this.expand,
    required this.collapse,
    required this.required,
    required this.invalidFormat,
    required this.chartTableShow,
    required this.chartTableHide,
    required this.chartCategory,
    required this.chartValue,
    required this.chartPercent,
    required this.chartOther,
    required this.regenerate,
    required this.thinking,
    required this.toolInput,
    required this.toolError,
    required this.toolResult,
    required this.next,
    required this.skip,
    required this.otherOption,
    required this.pullToRefresh,
    required this.releaseToRefresh,
    required this.refreshing,
    required this.create,
    required this.dayUnit,
    required this.hourUnit,
    required this.minuteUnit,
    required this.secondUnit,
    required this.totalText,
    required this.rangeText,
    required this.emptyPresets,
  });

  /// 把局部覆盖合并到这份字典上。
  ///
  /// 缺的字段沿用原值而不是变成空串：接入方十有八九只想改两三句话，
  /// 不该逼他们抄一整份字典，也不该因为抄漏了一个键就在界面上开天窗。
  ///
  /// 改 empty 会顺带改掉空态那一句标题。这两处说的是同一件事，只是长短不同：
  /// empty 是列表、下拉里那一行短字，emptyPresets 里的是整块空态的大标题。
  /// 只改了 empty 却发现空态还写着「暂无数据」，接入方会以为覆盖没生效——
  /// 而真要分开写时，把 emptyPresets 一并传进来即可，那时以传进来的为准。
  ILocale copyWith({
    String? name,
    String? empty,
    String? emptyContent,
    String? loading,
    String? loadMore,
    String? loadFailed,
    String? noMore,
    String? placeholder,
    String? datePlaceholder,
    String? selectAll,
    String? search,
    String? searchNode,
    String? noMatch,
    String? clear,
    String? confirm,
    String? cancel,
    String? acknowledge,
    String? close,
    String? retry,
    String? copy,
    String? copied,
    String? expand,
    String? collapse,
    String? required,
    String? invalidFormat,
    String? chartTableShow,
    String? chartTableHide,
    String? chartCategory,
    String? chartValue,
    String? chartPercent,
    String? chartOther,
    String? regenerate,
    String? thinking,
    String? toolInput,
    String? toolError,
    String? toolResult,
    String? next,
    String? skip,
    String? otherOption,
    String? pullToRefresh,
    String? releaseToRefresh,
    String? refreshing,
    String? create,
    String? dayUnit,
    String? hourUnit,
    String? minuteUnit,
    String? secondUnit,
    String Function(int total)? totalText,
    String Function(int from, int to, int total)? rangeText,
    Map<IEmptyReason, IEmptyPreset>? emptyPresets,
  }) =>
      ILocale(
        name: name ?? this.name,
        empty: empty ?? this.empty,
        emptyContent: emptyContent ?? this.emptyContent,
        loading: loading ?? this.loading,
        loadMore: loadMore ?? this.loadMore,
        loadFailed: loadFailed ?? this.loadFailed,
        noMore: noMore ?? this.noMore,
        placeholder: placeholder ?? this.placeholder,
        datePlaceholder: datePlaceholder ?? this.datePlaceholder,
        selectAll: selectAll ?? this.selectAll,
        search: search ?? this.search,
        searchNode: searchNode ?? this.searchNode,
        noMatch: noMatch ?? this.noMatch,
        clear: clear ?? this.clear,
        confirm: confirm ?? this.confirm,
        cancel: cancel ?? this.cancel,
        acknowledge: acknowledge ?? this.acknowledge,
        close: close ?? this.close,
        retry: retry ?? this.retry,
        copy: copy ?? this.copy,
        copied: copied ?? this.copied,
        expand: expand ?? this.expand,
        collapse: collapse ?? this.collapse,
        required: required ?? this.required,
        invalidFormat: invalidFormat ?? this.invalidFormat,
        chartTableShow: chartTableShow ?? this.chartTableShow,
        chartTableHide: chartTableHide ?? this.chartTableHide,
        chartCategory: chartCategory ?? this.chartCategory,
        chartValue: chartValue ?? this.chartValue,
        chartPercent: chartPercent ?? this.chartPercent,
        chartOther: chartOther ?? this.chartOther,
        regenerate: regenerate ?? this.regenerate,
        thinking: thinking ?? this.thinking,
        toolInput: toolInput ?? this.toolInput,
        toolError: toolError ?? this.toolError,
        toolResult: toolResult ?? this.toolResult,
        next: next ?? this.next,
        skip: skip ?? this.skip,
        otherOption: otherOption ?? this.otherOption,
        pullToRefresh: pullToRefresh ?? this.pullToRefresh,
        releaseToRefresh: releaseToRefresh ?? this.releaseToRefresh,
        refreshing: refreshing ?? this.refreshing,
        create: create ?? this.create,
        dayUnit: dayUnit ?? this.dayUnit,
        hourUnit: hourUnit ?? this.hourUnit,
        minuteUnit: minuteUnit ?? this.minuteUnit,
        secondUnit: secondUnit ?? this.secondUnit,
        totalText: totalText ?? this.totalText,
        rangeText: rangeText ?? this.rangeText,
        emptyPresets: emptyPresets ??
            (empty == null
                ? this.emptyPresets
                : {
                    ...this.emptyPresets,
                    IEmptyReason.empty: IEmptyPreset(
                      title: empty,
                      description:
                          this.emptyPresets[IEmptyReason.empty]!.description,
                    ),
                  }),
      );
}

final ILocale zhCN = ILocale(
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
  totalText: (total) => '共 $total 条',
  rangeText: (from, to, total) => '第 $from-$to 条 / 共 $total 条',
  emptyPresets: const {
    IEmptyReason.empty:
        IEmptyPreset(title: '暂无数据', description: '这里还没有内容，创建第一条试试。'),
    IEmptyReason.search:
        IEmptyPreset(title: '没有匹配结果', description: '换个关键词，或减少筛选条件。'),
    IEmptyReason.error: IEmptyPreset(title: '加载失败', description: '请检查网络后重试。'),
    IEmptyReason.permission:
        IEmptyPreset(title: '无访问权限', description: '请联系管理员申请该资源的访问权限。'),
  },
);

final ILocale enUS = ILocale(
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
  totalText: (total) => '$total item${total == 1 ? '' : 's'}',
  rangeText: (from, to, total) => '$from-$to of $total',
  emptyPresets: const {
    IEmptyReason.empty: IEmptyPreset(
        title: 'No data', description: 'Nothing here yet — create the first one.'),
    IEmptyReason.search: IEmptyPreset(
        title: 'No matches', description: 'Try another keyword, or drop a filter.'),
    IEmptyReason.error: IEmptyPreset(
        title: 'Failed to load', description: 'Check your connection and try again.'),
    IEmptyReason.permission: IEmptyPreset(
        title: 'No access',
        description: 'Ask an administrator for access to this resource.'),
  },
);
