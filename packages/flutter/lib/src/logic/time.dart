/// 时间取值规则的 Dart 移植（对应 packages/common/src/logic/time.ts）。
///
/// 「几点算合法」抄错不会报错，只会让同一个表单在两端上能选的时刻不一样。
library;

import 'dart:math' as math;

class ITimeValue {
  const ITimeValue({this.hour = 0, this.minute = 0, this.second = 0});
  final int hour;
  final int minute;
  final int second;

  ITimeValue copyWith({int? hour, int? minute, int? second}) => ITimeValue(
        hour: hour ?? this.hour,
        minute: minute ?? this.minute,
        second: second ?? this.second,
      );

  @override
  bool operator ==(Object other) =>
      other is ITimeValue && other.hour == hour && other.minute == minute && other.second == second;

  @override
  int get hashCode => Object.hash(hour, minute, second);

  @override
  String toString() => 'ITimeValue($hour:$minute:$second)';
}

const ITimeValue kTimeZero = ITimeValue();

/// 折算成当天的秒数，用来比较先后
int toSeconds(ITimeValue time) => time.hour * 3600 + time.minute * 60 + time.second;

ITimeValue fromSeconds(num total) {
  final clamped = math.max(0, math.min(86399, total.round()));
  return ITimeValue(
    hour: clamped ~/ 3600,
    minute: (clamped % 3600) ~/ 60,
    second: clamped % 60,
  );
}

/// 补零成 HH:mm 或 HH:mm:ss。
///
/// 一律补零而不是让 9:5 这样出现：时间是要被对齐着读的，
/// 列表里一列宽度不一的时间，扫一眼根本比不出先后。
String formatTime(ITimeValue time, {bool showSecond = true}) {
  String pad(int n) => n.toString().padLeft(2, '0');
  final base = '${pad(time.hour)}:${pad(time.minute)}';
  return showSecond ? '$base:${pad(time.second)}' : base;
}

/// 解析 HH:mm[:ss]。解析不出来返回 null，由调用方决定是清空还是保留原值
ITimeValue? parseTime(String text) {
  final match = RegExp(r'^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$').firstMatch(text.trim());
  if (match == null) return null;
  final hour = int.parse(match.group(1)!);
  final minute = int.parse(match.group(2)!);
  final second = match.group(3) != null ? int.parse(match.group(3)!) : 0;
  if (hour > 23 || minute > 59 || second > 59) return null;
  return ITimeValue(hour: hour, minute: minute, second: second);
}

/// 某一列可选的数字。步长按 0 起算，因此 step=15 给出 0/15/30/45
List<int> timeColumn(String unit, {int step = 1}) {
  final size = unit == 'hour' ? 24 : 60;
  final safe = math.max(1, step);
  final out = <int>[];
  for (var i = 0; i < size; i += safe) {
    out.add(i);
  }
  return out;
}

/// 这个值在范围内是否可选。
///
/// 按位判定而不是先拼成完整时间再比大小：选择器是一列一列点的，
/// 用户点「小时」那一刻，分和秒还是上一次的值。拼起来比较的话，
/// 一个本来合法的小时会因为分秒不合法而被禁掉——用户看到的是「这个点点不动」，
/// 而他根本没打算保留那个分秒。
bool isUnitEnabled(
  String unit,
  int value,
  ITimeValue current, {
  ITimeValue? min,
  ITimeValue? max,
}) {
  if (unit == 'hour') {
    if (min != null && value < min.hour) return false;
    if (max != null && value > max.hour) return false;
    return true;
  }

  if (unit == 'minute') {
    if (min != null && current.hour == min.hour && value < min.minute) return false;
    if (max != null && current.hour == max.hour && value > max.minute) return false;
    return true;
  }

  if (min != null &&
      current.hour == min.hour &&
      current.minute == min.minute &&
      value < min.second) {
    return false;
  }
  if (max != null &&
      current.hour == max.hour &&
      current.minute == max.minute &&
      value > max.second) {
    return false;
  }
  return true;
}

/// 把一个时间夹进范围并对齐到步长。
///
/// 顺序是先夹范围再对齐步长，不能反过来：先对齐可能把值推出范围外，
/// 再夹回来又不在步长上，于是列表里高亮的那一项和实际值对不上。
ITimeValue clampTime(
  ITimeValue time, {
  ITimeValue? min,
  ITimeValue? max,
  int hourStep = 1,
  int minuteStep = 1,
  int secondStep = 1,
  bool showSecond = true,
}) {
  var seconds = toSeconds(time);
  if (min != null) seconds = math.max(seconds, toSeconds(min));
  if (max != null) seconds = math.min(seconds, toSeconds(max));
  final clamped = fromSeconds(seconds);

  int align(int value, int step) => step <= 1 ? value : (value ~/ step) * step;

  return ITimeValue(
    hour: align(clamped.hour, hourStep),
    minute: align(clamped.minute, minuteStep),
    // 不显示秒时一律归零：留一个用户从没见过的秒数，提交后对不上账
    second: showSecond ? align(clamped.second, secondStep) : 0,
  );
}

/// 区间是否合法。
///
/// 允许起止相等（表示一个瞬间），不允许结束早于开始——
/// 跨天的区间要用日期来表达，在只有时分秒的控件里表达跨天，
/// 读者没有任何线索能看出这是「到第二天」。
bool isValidRange(ITimeValue start, ITimeValue end) => toSeconds(end) >= toSeconds(start);
