/// 查询条件的状态机与参数往返（astra.md 的 B03）。
///
/// 与 packages/common/src/logic/query.ts 同源，由生成的 logic_parity_test 对齐。
///
/// 三件事在这里定死：条件一变回第一页（否则改完筛选看到的是空白的第 7 页，
/// 而结果只有两页）；参数往返无损且键顺序稳定；无效参数不静默丢弃，逐条报出来。
///
/// Flutter 没有地址栏——这也正是契约里只有「参数记录」而没有 URL 的原因：
/// 这份 Map 放进路由参数对象即可，与 Web 的 query string 是同一份数据。
const int kDefaultPageSize = 20;

enum IFilterKind { text, select, multiSelect, numberRange, dateRange }

class IFilterOption {
  const IFilterOption({required this.value, required this.label});

  final String value;
  final String label;
}

class IFilterField {
  const IFilterField({
    required this.name,
    required this.label,
    required this.kind,
    this.options = const [],
    this.placeholder = '',
    this.always = false,
  });

  final String name;
  final String label;
  final IFilterKind kind;
  final List<IFilterOption> options;
  final String placeholder;

  /// 折叠时是否仍然显示。常用的一两个字段应当常驻
  final bool always;
}

/// 范围类字段的值。两端都可以缺，表示单边开区间
class IFilterRange {
  const IFilterRange({this.from, this.to});

  final String? from;
  final String? to;

  @override
  bool operator ==(Object other) =>
      other is IFilterRange && other.from == from && other.to == to;

  @override
  int get hashCode => Object.hash(from, to);
}

/// 取值是 String / List<String> / IFilterRange 三选一
class IQueryState {
  const IQueryState({
    this.values = const {},
    this.page = 1,
    this.pageSize = kDefaultPageSize,
  });

  final Map<String, Object> values;
  final int page;
  final int pageSize;

  IQueryState copyWith({Map<String, Object>? values, int? page, int? pageSize}) => IQueryState(
        values: values ?? this.values,
        page: page ?? this.page,
        pageSize: pageSize ?? this.pageSize,
      );
}

class IInvalidParam {
  const IInvalidParam({required this.name, required this.raw, required this.reason});

  final String name;
  final String raw;
  final String reason;
}

class IQuickFilter {
  const IQuickFilter({required this.key, required this.label, required this.values});

  final String key;
  final String label;
  final Map<String, Object> values;
}

const String _rangeSep = '~';
const String _listSep = ',';

bool isEmptyFilterValue(Object? value) {
  if (value == null) return true;
  if (value is String) return value.trim().isEmpty;
  if (value is List) return value.isEmpty;
  if (value is IFilterRange) return value.from == null && value.to == null;
  return false;
}

int activeFilterCount(Map<String, Object> values) =>
    values.values.where((v) => !isEmptyFilterValue(v)).length;

/// 条件变更。页码回到 1——但把同一个值再选一遍不该打断翻页。
IQueryState changeFilter(IQueryState state, String name, Object? value) {
  final before = state.values[name];
  final same = _sameValue(before, value);
  final values = Map<String, Object>.from(state.values);
  if (isEmptyFilterValue(value)) {
    values.remove(name);
  } else {
    values[name] = value!;
  }
  return state.copyWith(values: values, page: same ? state.page : 1);
}

bool _sameValue(Object? a, Object? b) {
  if (a is List && b is List) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i += 1) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
  return a == b;
}

/// 清空：条件全清，页码回 1，每页条数保留——那是显示偏好，不是筛选条件
IQueryState clearFilters(IQueryState state) =>
    state.copyWith(values: const {}, page: 1);

/// 快捷筛选整套替换当前条件，而不是叠加：叠加的话点两次会得到互相矛盾的条件
IQueryState applyQuickFilter(IQueryState state, IQuickFilter quick) =>
    state.copyWith(values: Map<String, Object>.from(quick.values), page: 1);

String _normalizeForCompare(Map<String, Object> values) {
  final entries = values.entries.where((e) => !isEmptyFilterValue(e.value)).toList()
    ..sort((a, b) => a.key.compareTo(b.key));
  return entries
      .map((e) {
        final v = e.value;
        if (v is List) {
          final sorted = [...v.map((x) => '$x')]..sort();
          return '${e.key}=${sorted.join(_listSep)}';
        }
        if (v is IFilterRange) return '${e.key}=${v.from ?? ''}$_rangeSep${v.to ?? ''}';
        return '${e.key}=$v';
      })
      .join('&');
}

bool matchQuickFilter(Map<String, Object> values, IQuickFilter quick) =>
    _normalizeForCompare(values) == _normalizeForCompare(quick.values);

/// 条件 → 参数记录。键按字段名排序，保证同一组条件每次出来都一样
Map<String, String> serializeValues(Map<String, Object> values, List<IFilterField> fields) {
  final sorted = [...fields]..sort((a, b) => a.name.compareTo(b.name));
  final out = <String, String>{};
  for (final field in sorted) {
    final value = values[field.name];
    if (isEmptyFilterValue(value)) continue;
    if (value is String) {
      out[field.name] = value.trim();
    } else if (value is List) {
      out[field.name] = value.map((v) => '$v').join(_listSep);
    } else if (value is IFilterRange) {
      out[field.name] = '${value.from ?? ''}$_rangeSep${value.to ?? ''}';
    }
  }
  return out;
}

Map<String, String> serializeQuery(IQueryState state, List<IFilterField> fields) {
  final out = serializeValues(state.values, fields);
  // 第一页与默认页长不进参数：它们是默认值，写进去只会让链接变长
  if (state.page > 1) out['page'] = '${state.page}';
  if (state.pageSize != kDefaultPageSize) out['pageSize'] = '${state.pageSize}';
  return out;
}

class IParseResult {
  const IParseResult({required this.state, required this.invalid});

  final IQueryState state;
  final List<IInvalidParam> invalid;
}

/// 参数记录 → 条件。认不出来的一律退回默认，并逐条报出原因——
/// 用户是从别人那儿粘来的链接，他有权知道哪一条没生效。
IParseResult parseQuery(Map<String, String> params, List<IFilterField> fields) {
  final invalid = <IInvalidParam>[];
  final values = <String, Object>{};
  final byName = {for (final f in fields) f.name: f};

  for (final entry in params.entries) {
    final name = entry.key;
    final raw = entry.value;
    if (raw.isEmpty || name == 'page' || name == 'pageSize') continue;
    final field = byName[name];
    if (field == null) {
      invalid.add(IInvalidParam(name: name, raw: raw, reason: '这个筛选项已经不存在了'));
      continue;
    }
    switch (field.kind) {
      case IFilterKind.text:
        values[name] = raw;
      case IFilterKind.select:
      case IFilterKind.multiSelect:
        final allowed = field.options.map((o) => o.value).toSet();
        final picked = (field.kind == IFilterKind.multiSelect ? raw.split(_listSep) : [raw])
            .map((v) => v.trim())
            .where((v) => v.isNotEmpty)
            .toList();
        final good = picked.where(allowed.contains).toList();
        final bad = picked.where((v) => !allowed.contains(v)).toList();
        if (bad.isNotEmpty) {
          invalid.add(IInvalidParam(
            name: name,
            raw: bad.join(_listSep),
            reason: '${field.label} 里没有这个取值',
          ));
        }
        if (good.isNotEmpty) {
          values[name] = field.kind == IFilterKind.multiSelect ? good : good.first;
        }
      case IFilterKind.numberRange:
      case IFilterKind.dateRange:
        final parts = raw.split(_rangeSep);
        if (parts.length < 2) {
          invalid.add(IInvalidParam(
            name: name,
            raw: raw,
            reason: '${field.label} 的范围要写成「开始$_rangeSep结束」',
          ));
          continue;
        }
        final from = parts[0];
        final to = parts[1];
        if (field.kind == IFilterKind.numberRange) {
          final nums = [from, to].where((n) => n.isNotEmpty);
          if (nums.any((n) => double.tryParse(n) == null)) {
            invalid.add(IInvalidParam(name: name, raw: raw, reason: '${field.label} 的范围不是数字'));
            continue;
          }
        }
        if (from.isNotEmpty && to.isNotEmpty && from.compareTo(to) > 0) {
          // 不替用户对调：他可能是把字段填错了位置，悄悄换过来会掩盖这件事
          invalid.add(IInvalidParam(name: name, raw: raw, reason: '${field.label} 的开始晚于结束'));
          continue;
        }
        if (from.isNotEmpty || to.isNotEmpty) {
          values[name] = IFilterRange(
            from: from.isEmpty ? null : from,
            to: to.isEmpty ? null : to,
          );
        }
    }
  }

  var page = 1;
  final rawPage = params['page'];
  if (rawPage != null && rawPage.isNotEmpty) {
    final n = int.tryParse(rawPage);
    if (n == null || n < 1) {
      invalid.add(IInvalidParam(name: 'page', raw: rawPage, reason: '页码不是正整数'));
    } else {
      page = n;
    }
  }

  var pageSize = kDefaultPageSize;
  final rawSize = params['pageSize'];
  if (rawSize != null && rawSize.isNotEmpty) {
    final n = int.tryParse(rawSize);
    if (n == null || n < 1) {
      invalid.add(IInvalidParam(name: 'pageSize', raw: rawSize, reason: '每页条数不是正整数'));
    } else {
      pageSize = n;
    }
  }

  return IParseResult(
    state: IQueryState(values: values, page: page, pageSize: pageSize),
    invalid: invalid,
  );
}
