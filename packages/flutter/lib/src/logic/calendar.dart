/// 日历视图的 Dart 移植（对应 packages/common/src/logic/date.ts 与 calendar.ts）。
///
/// Web 端的日期工具此前没有 Dart 版本——DatePicker 那一端用的是 Flutter 自带的
/// showDatePicker。日历要自己画格子，所以把格子生成与范围选择一并移过来，
/// 「点第二下是结束日期还是重新开始选」这类两种都说得通的规则才不会分叉。
library;

/// ISO 日期串，YYYY-MM-DD
String toISO(DateTime date) =>
    '${date.year.toString().padLeft(4, '0')}-'
    '${date.month.toString().padLeft(2, '0')}-'
    '${date.day.toString().padLeft(2, '0')}';

DateTime? parseISO(String? value) {
  if (value == null || value.isEmpty) return null;
  final parts = value.split('-');
  if (parts.length != 3) return null;
  final y = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  final d = int.tryParse(parts[2]);
  if (y == null || m == null || d == null) return null;
  return DateTime(y, m, d);
}

DateTime startOfMonth(DateTime date) => DateTime(date.year, date.month, 1);

DateTime addMonths(DateTime date, int delta) => DateTime(date.year, date.month + delta, 1);

DateTime addDays(DateTime date, int delta) =>
    DateTime(date.year, date.month, date.day + delta);

class ICalendarCell {
  const ICalendarCell({
    required this.date,
    required this.iso,
    required this.day,
    required this.outside,
    required this.today,
  });

  final DateTime date;
  final String iso;
  final int day;

  /// 是否属于当前展示的月份；上下月补白用于凑满 6 行
  final bool outside;
  final bool today;
}

/// 生成 6×7 的日历格子。固定 6 行是为了切换月份时面板高度不跳动。
/// weekStart：0 表示周日开头，1 表示周一开头。
List<ICalendarCell> buildCalendar(DateTime viewDate, {int weekStart = 1}) {
  final first = startOfMonth(viewDate);
  // Dart 的 weekday 是 1..7（周一到周日），先折算成 0..6 的周日制再对齐
  final firstDow = first.weekday % 7;
  final offset = (firstDow - weekStart + 7) % 7;
  final start = addDays(first, -offset);
  final todayISO = toISO(DateTime.now());

  return List.generate(42, (i) {
    final date = addDays(start, i);
    final iso = toISO(date);
    return ICalendarCell(
      date: date,
      iso: iso,
      day: date.day,
      outside: date.month != viewDate.month,
      today: iso == todayISO,
    );
  });
}

List<String> weekdayLabels({int weekStart = 1}) {
  const labels = ['日', '一', '二', '三', '四', '五', '六'];
  return weekStart == 1 ? [...labels.sublist(1), labels[0]] : labels;
}

class ICalendarMark {
  const ICalendarMark({required this.date, this.label = '', this.type = 'brand'});

  /// ISO 日期，YYYY-MM-DD
  final String date;

  /// 一句话说明，显示在格子里
  final String label;

  /// 语义色：与状态色对齐，而不是自选颜色
  final String type;
}

class IDateRange {
  const IDateRange({this.start, this.end});
  final String? start;
  final String? end;

  @override
  bool operator ==(Object other) =>
      other is IDateRange && other.start == start && other.end == end;

  @override
  int get hashCode => Object.hash(start, end);

  @override
  String toString() => 'IDateRange($start, $end)';
}

/// 把标记按日期归拢，渲染时一次查表，不必每格都遍历一遍
Map<String, List<ICalendarMark>> groupMarks(List<ICalendarMark> marks) {
  final map = <String, List<ICalendarMark>>{};
  for (final mark in marks) {
    map.putIfAbsent(mark.date, () => <ICalendarMark>[]).add(mark);
  }
  return map;
}

/// 点一天之后，选中范围变成什么。
///
/// 已经选完一段再点，是「重新开始选」而不是「延长这一段」。
/// 延长的语义在只有点击、没有拖拽的界面里说不清——用户点第三下时，
/// 没有任何线索告诉他这一下会改起点还是改终点。
///
/// 点到比起点更早的日期时自动对调，而不是拒绝：用户从右往左选是常事，
/// 拒绝的话他得先想明白「原来要从左边开始点」，而这条规则界面上没写。
IDateRange selectRange(IDateRange range, String iso) {
  if (range.start == null || range.end != null) return IDateRange(start: iso);
  return iso.compareTo(range.start!) < 0
      ? IDateRange(start: iso, end: range.start)
      : IDateRange(start: range.start, end: iso);
}

bool isInRange(String iso, IDateRange range) {
  if (range.start == null || range.end == null) return false;
  return iso.compareTo(range.start!) >= 0 && iso.compareTo(range.end!) <= 0;
}

/// 'start' / 'end' / null
String? isRangeEdge(String iso, IDateRange range) {
  if (iso == range.start) return 'start';
  if (iso == range.end) return 'end';
  return null;
}

/// 键盘导航：方向键按天走，上下按周走。
///
/// 日历必须能用键盘走完。只能点的话，用键盘操作的人要选一个三个月后的日期
/// 得先穿过前面所有格子——42 个格子，每换一个月再来一遍。
String? moveFocus(String iso, String key) {
  const deltas = {
    'ArrowLeft': -1,
    'ArrowRight': 1,
    'ArrowUp': -7,
    'ArrowDown': 7,
    'PageUp': -28,
    'PageDown': 28,
  };
  final delta = deltas[key];
  if (delta == null) return null;
  final date = parseISO(iso);
  if (date == null) return null;
  return toISO(addDays(date, delta));
}
