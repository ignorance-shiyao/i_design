/// 数据集的规整、聚合与质量判定（对应 logic/dataset.ts）。
///
/// 只做一件事：把「数据本身有什么问题」变成明确的结论，而不是在渲染时悄悄抹平。
/// 抹平的写法都很短——补 0、丢掉空值、取绝对值——每一个都会让图说出与数据不同的话。
enum IAggregation { sum, avg, min, max, count, median, p95 }

enum IFieldKind { dimension, measure, time }

class IChartField {
  const IChartField({
    required this.key,
    required this.label,
    required this.kind,
    this.unit = '',
    this.tzOffsetMinutes = 0,
  });

  final String key;
  final String label;
  final IFieldKind kind;
  final String unit;

  /// 时间字段的时区偏移（分钟）。不给则按 UTC 分桶，不按设备所在时区
  final int tzOffsetMinutes;
}

class IChartDataset {
  const IChartDataset({required this.fields, required this.rows, this.note = ''});

  final List<IChartField> fields;

  /// 每行是「字段名 → 值」；值为 null 表示没有数据，不是 0
  final List<Map<String, Object?>> rows;
  final String note;
}

class IChartSpec {
  const IChartSpec({
    required this.x,
    required this.y,
    this.groupBy = '',
    this.aggregate = IAggregation.sum,
    this.bucket = '',
  });

  final String x;
  final List<String> y;
  final String groupBy;
  final IAggregation aggregate;

  /// hour / day / week / month，空表示不分桶
  final String bucket;
}

double? _asNumber(Object? value) {
  if (value is num && value.isFinite) return value.toDouble();
  return null;
}

double _quantile(List<double> sorted, double p) {
  if (sorted.isEmpty) return 0;
  final index = (sorted.length - 1) * p;
  final low = index.floor();
  final high = index.ceil();
  if (low == high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
}

/// 聚合一组值。空集合返回 null 而不是 0——「没有数据」与「加起来是 0」是两件事。
/// count 是唯一的例外：没有数据就是 0 条。
double? iAggregate(List<double?> values, [IAggregation how = IAggregation.sum]) {
  final numbers = values.whereType<double>().toList();
  if (how == IAggregation.count) return numbers.length.toDouble();
  if (numbers.isEmpty) return null;
  switch (how) {
    case IAggregation.sum:
      return numbers.reduce((a, b) => a + b);
    case IAggregation.avg:
      return numbers.reduce((a, b) => a + b) / numbers.length;
    case IAggregation.min:
      return numbers.reduce((a, b) => a < b ? a : b);
    case IAggregation.max:
      return numbers.reduce((a, b) => a > b ? a : b);
    case IAggregation.median:
      return _quantile(numbers..sort(), 0.5);
    case IAggregation.p95:
      return _quantile(numbers..sort(), 0.95);
    case IAggregation.count:
      return numbers.length.toDouble();
  }
}

const int _day = 86400000;

/// 时间分桶。按给定时区偏移分桶而不是设备所在时区：
/// 同一份日报在北京与柏林打开会落进不同的天，两个人看着同一张图讨论「上周三」
/// 说的却是不同的两天。
int iBucketStart(int ms, String bucket, [int tzOffsetMinutes = 0]) {
  final shifted = ms + tzOffsetMinutes * 60000;
  final date = DateTime.fromMillisecondsSinceEpoch(shifted, isUtc: true);
  int start;
  switch (bucket) {
    case 'hour':
      start = (shifted ~/ 3600000) * 3600000;
    case 'day':
      start = (shifted ~/ _day) * _day;
    case 'week':
      // 周一为一周之始：ISO 的约定，也是国内排班的约定
      final weekday = (date.weekday - 1) % 7;
      start = (shifted ~/ _day) * _day - weekday * _day;
    case 'month':
      start = DateTime.utc(date.year, date.month, 1).millisecondsSinceEpoch;
    default:
      start = shifted;
  }
  return start - tzOffsetMinutes * 60000;
}

class ISeriesPoint {
  const ISeriesPoint(this.x, this.y);

  final Object x;

  /// null 表示这一点没有数据。不要在这里补 0
  final double? y;
}

class IDatasetSeries {
  const IDatasetSeries({required this.name, required this.points, this.unit = ''});

  final String name;
  final String unit;
  final List<ISeriesPoint> points;
}

IChartField? _fieldOf(IChartDataset dataset, String key) {
  for (final field in dataset.fields) {
    if (field.key == key) return field;
  }
  return null;
}

/// 按 spec 把数据集折成若干系列。
/// 分组键缺失时归到「未知」而不是丢掉：丢掉会让总数对不上。
List<IDatasetSeries> iToSeries(IChartDataset dataset, IChartSpec spec) {
  final xField = _fieldOf(dataset, spec.x);
  final isTime = xField?.kind == IFieldKind.time;
  final tz = xField?.tzOffsetMinutes ?? 0;

  Object keyOf(Map<String, Object?> row) {
    final raw = row[spec.x];
    if (isTime && raw is num) {
      return spec.bucket.isEmpty ? raw.toInt() : iBucketStart(raw.toInt(), spec.bucket, tz);
    }
    if (raw == null || raw == '') return '未知';
    return raw;
  }

  final groups = <String, Map<Object, List<double?>>>{};
  final xOrder = <Object>[];

  for (final row in dataset.rows) {
    final x = keyOf(row);
    if (!xOrder.contains(x)) xOrder.add(x);
    for (final measure in spec.y) {
      final groupValue = spec.groupBy.isEmpty ? null : row[spec.groupBy];
      final groupName = spec.groupBy.isEmpty
          ? (_fieldOf(dataset, measure)?.label ?? measure)
          : (groupValue == null || groupValue == '' ? '未知' : '$groupValue');
      final series = groups.putIfAbsent(groupName, () => <Object, List<double?>>{});
      series.putIfAbsent(x, () => <double?>[]).add(_asNumber(row[measure]));
    }
  }

  // 时间轴按时间排序；分类轴保持出现顺序——重排会让「按金额降序」的表白排
  final axis = isTime
      ? (List<Object>.from(xOrder)..sort((a, b) => (a as int).compareTo(b as int)))
      : xOrder;

  return groups.entries
      .map((entry) => IDatasetSeries(
            name: entry.key,
            unit: _fieldOf(dataset, spec.y.first)?.unit ?? '',
            points: axis
                .map((x) => ISeriesPoint(x, iAggregate(entry.value[x] ?? const [], spec.aggregate)))
                .toList(),
          ))
      .toList();
}
