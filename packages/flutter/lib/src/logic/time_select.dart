/// 固定间隔的时间点序列（与 packages/common/src/logic/time.ts 的 timeSelectOptions 同算法）。
///
/// 用分钟数递增而不是「小时循环里嵌分钟循环」：步长是 45、90 这类不能整除 60 的值时，
/// 嵌套循环会漏掉跨小时的那些点（09:45 之后应当是 10:30，而不是回到 10:00）。
library;

class TimeSelectOption {
  const TimeSelectOption(this.value, this.disabled);

  final String value;
  final bool disabled;

  @override
  bool operator ==(Object other) =>
      other is TimeSelectOption && other.value == value && other.disabled == disabled;

  @override
  int get hashCode => Object.hash(value, disabled);

  @override
  String toString() => 'TimeSelectOption($value, $disabled)';
}

/// "HH:mm" → 当天分钟数；格式不对返回 null，而不是悄悄当成 0 点
int? minutesOfClock(String text) {
  final match = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(text.trim());
  if (match == null) return null;
  final hour = int.parse(match.group(1)!);
  final minute = int.parse(match.group(2)!);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

/// 当天分钟数 → "HH:mm"，两位补零
String clockOfMinutes(int minutes) {
  final hour = (minutes ~/ 60) % 24;
  final minute = minutes % 60;
  return '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
}

/// 不可选的点仍然生成、只标记 disabled：直接过滤掉的话，列表长度会随另一端的取值
/// 变来变去，用户刚记住「第三个是 10:00」，换个开始时间就不是了。
List<TimeSelectOption> timeSelectOptions({
  required String start,
  required String end,
  required int step,
  String? minTime,
  String? maxTime,
}) {
  final safeStep = step < 1 ? 1 : step;
  final from = minutesOfClock(start);
  final to = minutesOfClock(end);
  if (from == null || to == null || to < from) return const [];

  final min = minTime == null ? null : minutesOfClock(minTime);
  final max = maxTime == null ? null : minutesOfClock(maxTime);

  final out = <TimeSelectOption>[];
  for (var minutes = from; minutes <= to; minutes += safeStep) {
    final disabled = (min != null && minutes <= min) || (max != null && minutes >= max);
    out.add(TimeSelectOption(clockOfMinutes(minutes), disabled));
  }
  return out;
}
