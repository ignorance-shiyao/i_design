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
  final String selectAll;
  final String search;
  final String noMatch;
  final String clear;

  final String confirm;
  final String cancel;
  final String acknowledge;

  final String expand;
  final String collapse;

  final String required;
  final String invalidFormat;

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
    required this.selectAll,
    required this.search,
    required this.noMatch,
    required this.clear,
    required this.confirm,
    required this.cancel,
    required this.acknowledge,
    required this.expand,
    required this.collapse,
    required this.required,
    required this.invalidFormat,
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
    String? selectAll,
    String? search,
    String? noMatch,
    String? clear,
    String? confirm,
    String? cancel,
    String? acknowledge,
    String? expand,
    String? collapse,
    String? required,
    String? invalidFormat,
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
        selectAll: selectAll ?? this.selectAll,
        search: search ?? this.search,
        noMatch: noMatch ?? this.noMatch,
        clear: clear ?? this.clear,
        confirm: confirm ?? this.confirm,
        cancel: cancel ?? this.cancel,
        acknowledge: acknowledge ?? this.acknowledge,
        expand: expand ?? this.expand,
        collapse: collapse ?? this.collapse,
        required: required ?? this.required,
        invalidFormat: invalidFormat ?? this.invalidFormat,
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
  selectAll: '全选',
  search: '搜索',
  noMatch: '无匹配选项',
  clear: '清除',
  confirm: '确定',
  cancel: '取消',
  acknowledge: '知道了',
  expand: '展开',
  collapse: '收起',
  required: '此项必填',
  invalidFormat: '格式不正确',
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
  selectAll: 'Select all',
  search: 'Search',
  noMatch: 'No matches',
  clear: 'Clear',
  confirm: 'OK',
  cancel: 'Cancel',
  acknowledge: 'Got it',
  expand: 'Expand',
  collapse: 'Collapse',
  required: 'This field is required',
  invalidFormat: 'Invalid format',
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
