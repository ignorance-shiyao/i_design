/// 批量导入的纯逻辑（对应 packages/common/src/logic/importjob.ts，astra.md 的 B11）。
///
/// 导入向导通常是：上传 → 列映射 → 预校验 → 真正导入。四步里有三处一做错
/// 就会让用户付出真实代价，这一层只管这三处：
///
/// 一、**预校验不写业务数据**。预检一旦落库，用户看完报告点了取消，数据已经
/// 脏了——而他以为自己什么也没做。预检函数只接受一个纯校验器，拿不到任何
/// 写入口；报告里的 wrote 永远是 false，它是契约的一部分。
///
/// 二、**列映射可回退**。映射是数据，不是一次性的向导步骤。
///
/// 三、**部分失败可重试且幂等**。同一份文件 + 同一套映射算出同一个幂等键。
library;

class ISourceColumn {
  const ISourceColumn({required this.key, this.sample});

  /// 文件表头里的原文
  final String key;

  /// 第一行的样例值，帮人确认这一列是不是他以为的那一列
  final String? sample;
}

class ITargetField {
  const ITargetField({
    required this.key,
    required this.label,
    this.required = false,
    this.aliases = const [],
  });

  final String key;
  final String label;
  final bool required;

  /// 常见的别名。表头叫「联系人」而字段叫「负责人」是常态
  final List<String> aliases;
}

String _normalize(String text) =>
    text.trim().toLowerCase().replaceAll(RegExp(r'[\s_-]'), '');

/// 自动猜一版映射，当默认值用。
///
/// 只按名字与别名精确匹配，不做模糊匹配：猜错的成本比没猜到高得多——
/// 没猜到用户会去选，猜错了他多半直接点下一步。
Map<String, String?> guessMapping(
  List<ISourceColumn> sources,
  List<ITargetField> fields,
) {
  final used = <String>{};
  final mapping = <String, String?>{};
  for (final field in fields) {
    final names = [field.key, field.label, ...field.aliases].map(_normalize).toList();
    ISourceColumn? hit;
    for (final s in sources) {
      if (!used.contains(s.key) && names.contains(_normalize(s.key))) {
        hit = s;
        break;
      }
    }
    mapping[field.key] = hit?.key;
    if (hit != null) used.add(hit.key);
  }
  return mapping;
}

enum IMappingIssueLevel { error, warning }

class IMappingIssue {
  const IMappingIssue({required this.level, required this.field, required this.message});
  final IMappingIssueLevel level;
  final String field;
  final String message;
}

/// 必填没映上是 error，一个来源列映给两个字段是 error，
/// 选填没映上只是 warning——那一列会留空，是个合法的选择。
List<IMappingIssue> mappingIssues(
  Map<String, String?> mapping,
  List<ITargetField> fields,
) {
  final issues = <IMappingIssue>[];
  final seen = <String, List<String>>{};

  for (final field in fields) {
    final source = mapping[field.key];
    if (source == null || source.isEmpty) {
      issues.add(IMappingIssue(
        level: field.required ? IMappingIssueLevel.error : IMappingIssueLevel.warning,
        field: field.key,
        message: field.required
            ? '必填字段「${field.label}」还没映上'
            : '「${field.label}」没映上，导入后留空',
      ));
      continue;
    }
    seen.putIfAbsent(source, () => []).add(field.label);
  }

  seen.forEach((source, labels) {
    if (labels.length < 2) return;
    issues.add(IMappingIssue(
      level: IMappingIssueLevel.error,
      field: source,
      message: '来源列「$source」同时映给了 ${labels.join('、')}',
    ));
  });
  return issues;
}

/// 能不能往下走。只看 error，warning 不拦
bool canProceed(List<IMappingIssue> issues) =>
    !issues.any((i) => i.level == IMappingIssueLevel.error);

Map<String, String?> clearMapping(Map<String, String?> mapping, String field) =>
    {...mapping, field: null};

/// 把某个来源列指给某个字段；它若已被别的字段占着，先从那儿摘掉
Map<String, String?> assignMapping(
  Map<String, String?> mapping,
  String field,
  String? source,
) {
  final next = Map<String, String?>.from(mapping);
  if (source != null && source.isNotEmpty) {
    for (final key in next.keys.toList()) {
      if (next[key] == source) next[key] = null;
    }
  }
  next[field] = source;
  return next;
}

/* ---------- 预校验 ---------- */

class IRowProblem {
  const IRowProblem({required this.row, this.column, required this.message});

  /// 文件里的原始行号，从 1 起（表头不算）。用户拿着它去找那一行
  final int row;
  final String? column;
  final String message;

  @override
  bool operator ==(Object other) =>
      other is IRowProblem &&
      other.row == row &&
      other.column == column &&
      other.message == message;

  @override
  int get hashCode => Object.hash(row, column, message);
}

class IDryRunReport {
  const IDryRunReport({
    required this.total,
    required this.okRows,
    required this.problems,
    required this.summary,
  });

  final int total;
  final List<int> okRows;
  final List<IRowProblem> problems;

  /// 预检写没写业务数据。**永远是 false**——它是契约的一部分。
  bool get wrote => false;
  final String summary;
}

/// 跑一遍预检。第二个参数是纯校验器：它拿不到任何写入口，
/// 所以这个函数在类型上就不可能落库。
IDryRunReport dryRun<T>(
  List<T> rows,
  List<IRowProblem> Function(T row, int index) validate,
) {
  final problems = <IRowProblem>[];
  final okRows = <int>[];
  for (var i = 0; i < rows.length; i++) {
    final found = validate(rows[i], i);
    if (found.isEmpty) {
      okRows.add(i + 1);
      continue;
    }
    for (final item in found) {
      problems.add(IRowProblem(row: i + 1, column: item.column, message: item.message));
    }
  }
  final badRows = problems.map((p) => p.row).toSet().length;
  return IDryRunReport(
    total: rows.length,
    okRows: okRows,
    problems: problems,
    summary: badRows == 0
        ? '预检通过：${rows.length} 行都能导入'
        : '预检发现 $badRows 行有问题，其余 ${rows.length - badRows} 行可以导入',
  );
}

/// 错误清单的 CSV。第一列是原始行号——用户手里那份是几千行的表格。
String problemsCsv(List<IRowProblem> problems) {
  // 逐字符判断而不是拼正则：这三个字符里有引号、逗号与换行，
  // 写成正则字面量时很容易被相邻字符串拼接吃掉一半，而且不会报错。
  bool needsQuote(String v) => v.contains('"') || v.contains(',') || v.contains('\n');
  String escape(String value) =>
      needsQuote(value) ? '"${value.replaceAll('"', '""')}"' : value;
  final head = '行号,列,问题';
  final body = problems.map(
    (p) => [p.row.toString(), p.column ?? '', p.message].map(escape).join(','),
  );
  return [head, ...body].join('\n');
}

/* ---------- 幂等 ---------- */

/// 同一份文件 + 同一套映射 = 同一个幂等键。
///
/// 用排序后的键值对而不是对象序列化：键的书写顺序与用户点映射的顺序有关，
/// 不排序的话同一套映射会算出两个键，幂等立刻失效。
String importKey(String fileFingerprint, Map<String, String?> mapping) {
  final keys = mapping.keys.toList()..sort();
  final pairs = keys.map((k) => '$k=${mapping[k] ?? ''}').join('&');
  return '$fileFingerprint|$pairs';
}
