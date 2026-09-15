/// ProTable 查询层与列能力的纯逻辑（astra.md 的 B04 + B05）。
///
/// 与 packages/common/src/logic/{protable,columns}.ts 同源，由生成的
/// logic_parity_test 对齐。两条最容易出事、又都不会报错的规则在这里：
/// 过期响应必须丢掉；隐藏列不等于没有这一列。
import 'table.dart';

const int kTableDefaultPageSize = 20;

class ISortState {
  const ISortState({this.key, this.order});

  final String? key;
  final ISortOrder? order;

  @override
  bool operator ==(Object other) =>
      other is ISortState && other.key == key && other.order == order;

  @override
  int get hashCode => Object.hash(key, order);
}

class ITableQuery {
  const ITableQuery({
    this.filters = const {},
    this.sort = const ISortState(),
    this.page = 1,
    this.pageSize = kTableDefaultPageSize,
  });

  final Map<String, Object> filters;
  final ISortState sort;
  final int page;
  final int pageSize;

  ITableQuery copyWith({
    Map<String, Object>? filters,
    ISortState? sort,
    int? page,
    int? pageSize,
  }) =>
      ITableQuery(
        filters: filters ?? this.filters,
        sort: sort ?? this.sort,
        page: page ?? this.page,
        pageSize: pageSize ?? this.pageSize,
      );
}

class ITableResult<T> {
  const ITableResult({required this.seq, required this.rows, required this.total});

  final int seq;
  final List<T> rows;

  /// 总数必须与 rows 出自同一次请求：分两次取会让最后一页变成空白页
  final int total;
}

enum IRequestStatus { idle, loading, success, error, cancelled }

class ITableState<T> {
  const ITableState({
    this.query = const ITableQuery(),
    this.rows = const [],
    this.total = 0,
    this.status = IRequestStatus.idle,
    this.seq = 0,
    this.settledSeq = 0,
    this.error,
    this.discarded = const [],
  });

  final ITableQuery query;
  final List<T> rows;
  final int total;
  final IRequestStatus status;

  /// 已发出的最大序号
  final int seq;

  /// 已落地的序号；小于 seq 说明还有请求在路上
  final int settledSeq;
  final String? error;

  /// 被丢弃的过期响应序号，排查「点了没反应」时要看它
  final List<int> discarded;

  ITableState<T> copyWith({
    ITableQuery? query,
    List<T>? rows,
    int? total,
    IRequestStatus? status,
    int? seq,
    int? settledSeq,
    String? error,
    bool clearError = false,
    List<int>? discarded,
  }) =>
      ITableState<T>(
        query: query ?? this.query,
        rows: rows ?? this.rows,
        total: total ?? this.total,
        status: status ?? this.status,
        seq: seq ?? this.seq,
        settledSeq: settledSeq ?? this.settledSeq,
        error: clearError ? null : (error ?? this.error),
        discarded: discarded ?? this.discarded,
      );
}

/// 三态排序复用 logic/table 的 nextSortOrder：同一个「升/降/不排」只该有一份实现
ISortState toggleSort(ISortState sort, String key) {
  if (sort.key != key) return ISortState(key: key, order: ISortOrder.asc);
  final order = nextSortOrder(sort.order);
  // 取消排序时把 key 也清掉：留着会让下次点别的列时短暂出现两列都有排序标记
  return order == null ? const ISortState() : ISortState(key: key, order: order);
}

class IStartedRequest<T> {
  const IStartedRequest({required this.state, required this.query, required this.seq});

  final ITableState<T> state;
  final ITableQuery query;
  final int seq;
}

/// 发一次请求：序号加一，状态进 loading
IStartedRequest<T> startRequest<T>(ITableState<T> state) {
  final seq = state.seq + 1;
  return IStartedRequest<T>(
    state: state.copyWith(seq: seq, status: IRequestStatus.loading, clearError: true),
    query: state.query,
    seq: seq,
  );
}

/// 响应落地。序号不比已落地的新就丢掉并记下来——
/// 不丢的话，先发后到的旧结果会覆盖新结果，界面上看不出任何异常
ITableState<T> receive<T>(ITableState<T> state, ITableResult<T> result) {
  if (result.seq <= state.settledSeq) {
    return state.copyWith(discarded: [...state.discarded, result.seq]);
  }
  return state.copyWith(
    rows: result.rows,
    total: result.total,
    settledSeq: result.seq,
    status: result.seq == state.seq ? IRequestStatus.success : IRequestStatus.loading,
    clearError: true,
  );
}

/// 请求失败。过期请求的失败不该把当前这屏数据抹掉
ITableState<T> fail<T>(ITableState<T> state, int seq, String message) {
  if (seq <= state.settledSeq || seq < state.seq) {
    return state.copyWith(discarded: [...state.discarded, seq]);
  }
  return state.copyWith(status: IRequestStatus.error, error: message, settledSeq: seq);
}

/// 筛选变了才回第一页：把同一个条件再选一遍不该打断翻页
ITableState<T> setFilters<T>(ITableState<T> state, Map<String, Object> filters) {
  final changed = !_sameMap(state.query.filters, filters);
  return state.copyWith(
    query: state.query.copyWith(filters: filters, page: changed ? 1 : state.query.page),
  );
}

bool _sameMap(Map<String, Object> a, Map<String, Object> b) {
  if (a.length != b.length) return false;
  for (final entry in a.entries) {
    if (b[entry.key] != entry.value) return false;
  }
  return true;
}

/// 排序一定回第一页——排序变了之后「第 3 页」指的已经不是同一批行
ITableState<T> setSort<T>(ITableState<T> state, String key) => state.copyWith(
      query: state.query.copyWith(sort: toggleSort(state.query.sort, key), page: 1),
    );

ITableState<T> setPage<T>(ITableState<T> state, int page) =>
    state.copyWith(query: state.query.copyWith(page: page < 1 ? 1 : page));

/// 改每页条数回第一页：第 7 页在每页 20 与每页 100 下不是同一批行
ITableState<T> setPageSize<T>(ITableState<T> state, int pageSize) => state.copyWith(
      query: state.query.copyWith(pageSize: pageSize < 1 ? 1 : pageSize, page: 1),
    );

int pageCountOfTotal(int total, int pageSize) {
  final size = pageSize < 1 ? 1 : pageSize;
  final count = (total / size).ceil();
  return count < 1 ? 1 : count;
}

/// 当前页超出总页数时退回最后一页，而不是显示空白——空白页让用户以为数据没了
ITableState<T> clampTablePage<T>(ITableState<T> state) {
  final max = pageCountOfTotal(state.total, state.query.pageSize);
  return state.query.page > max ? setPage(state, max) : state;
}

bool isStale<T>(ITableState<T> state) =>
    state.status == IRequestStatus.loading && state.settledSeq < state.seq;

/* ---------- 列能力 ---------- */

enum ITableDensity { compact, normal, loose }

const Map<ITableDensity, double> kDensityRowHeight = {
  ITableDensity.compact: 32,
  ITableDensity.normal: 40,
  ITableDensity.loose: 52,
};

class IColumnSpec {
  const IColumnSpec({
    required this.key,
    required this.title,
    this.width,
    this.restricted = false,
    this.locked = false,
    this.sortable = false,
  });

  final String key;
  final String title;
  final double? width;

  /// 受权限控制。隐藏它不影响这个标记——把两者合并的后果是
  /// 「藏一列就等于跳过了那一列的权限检查」
  final bool restricted;

  /// 不允许隐藏（主键藏掉之后行就认不出来了）
  final bool locked;
  final bool sortable;
}

class IColumnSetting {
  const IColumnSetting({required this.key, this.hidden = false, this.width, this.fixed});

  final String key;
  final bool hidden;
  final double? width;

  /// 'left' / null
  final String? fixed;

  IColumnSetting copyWith({bool? hidden, double? width, String? fixed, bool clearFixed = false}) =>
      IColumnSetting(
        key: key,
        hidden: hidden ?? this.hidden,
        width: width ?? this.width,
        fixed: clearFixed ? null : (fixed ?? this.fixed),
      );
}

class IColumnState {
  const IColumnState({this.settings = const [], this.density = ITableDensity.normal});

  final List<IColumnSetting> settings;
  final ITableDensity density;

  IColumnState copyWith({List<IColumnSetting>? settings, ITableDensity? density}) =>
      IColumnState(settings: settings ?? this.settings, density: density ?? this.density);
}

IColumnState defaultColumnState(List<IColumnSpec> columns) => IColumnState(
      settings: [for (final c in columns) IColumnSetting(key: c.key, width: c.width)],
    );

class IResolvedColumn {
  const IResolvedColumn({
    required this.spec,
    required this.hidden,
    required this.width,
    required this.fixed,
  });

  final IColumnSpec spec;
  final bool hidden;
  final double? width;
  final String? fixed;

  String get key => spec.key;
  String get title => spec.title;
}

/// 顺序以 settings 为准；settings 里没有的列（新版本加的）追加在末尾并默认显示——
/// 丢掉它们的话，用户存过一次视图之后就再也看不到后来新增的列
List<IResolvedColumn> resolveTableColumns(List<IColumnSpec> columns, IColumnState state) {
  final byKey = {for (final c in columns) c.key: c};
  final known = state.settings.map((s) => s.key).toSet();
  final ordered = <IColumnSetting>[
    ...state.settings.where((s) => byKey.containsKey(s.key)),
    ...columns.where((c) => !known.contains(c.key)).map((c) => IColumnSetting(key: c.key, width: c.width)),
  ];
  return [
    for (final setting in ordered)
      IResolvedColumn(
        spec: byKey[setting.key]!,
        // 锁定列不许隐藏
        hidden: byKey[setting.key]!.locked ? false : setting.hidden,
        width: setting.width ?? byKey[setting.key]!.width,
        fixed: setting.fixed,
      )
  ];
}

List<IResolvedColumn> visibleTableColumns(List<IColumnSpec> columns, IColumnState state) =>
    resolveTableColumns(columns, state).where((c) => !c.hidden).toList();

/// 受权限控制的列，与显隐无关。导出与接口按它做校验
List<String> restrictedTableColumns(List<IColumnSpec> columns) =>
    [for (final c in columns) if (c.restricted) c.key];

IColumnState toggleColumn(IColumnState state, String key, List<IColumnSpec> columns) {
  final spec = columns.where((c) => c.key == key).firstOrNull;
  if (spec?.locked == true) return state;
  final settings = [
    for (final s in state.settings) s.key == key ? s.copyWith(hidden: !s.hidden) : s
  ];
  final next = state.copyWith(settings: settings);
  // 不允许把所有列都藏掉：空表格没有信息量，只会让人以为坏了
  return visibleTableColumns(columns, next).isEmpty ? state : next;
}

IColumnState moveColumn(IColumnState state, int from, int to) {
  if (from < 0 || from >= state.settings.length || to < 0 || to >= state.settings.length) {
    return state;
  }
  final settings = [...state.settings];
  final moved = settings.removeAt(from);
  settings.insert(to, moved);
  return state.copyWith(settings: settings);
}

IColumnState setDensity(IColumnState state, ITableDensity density) =>
    state.copyWith(density: density);

IColumnState resetColumns(List<IColumnSpec> columns) => defaultColumnState(columns);

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
