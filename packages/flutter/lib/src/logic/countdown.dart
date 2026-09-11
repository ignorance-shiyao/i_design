/// 倒计时的取值与格式化规则（对应 packages/common/src/logic/countdown.ts）。
///
/// 同一个截止时刻，一端在最后一秒显示「00:01」另一端显示「00:00」，
/// 用户会截图来问哪个是对的。两端必须是同一套取整规则。
library;

class CountdownParts {
  final int days;
  final int hours;
  final int minutes;
  final int seconds;
  final int milliseconds;

  const CountdownParts({
    required this.days,
    required this.hours,
    required this.minutes,
    required this.seconds,
    required this.milliseconds,
  });
}

/// 剩余毫秒数。已经过去就是 0，不给负数——「-3 秒」没有任何意义，只会漏到界面上
int countdownRemaining(int target, int now) {
  final left = target - now;
  return left < 0 ? 0 : left;
}

/// 拆成天/时/分/秒。
///
/// 不显示毫秒时按「向上取整到秒」拆：剩 1.4 秒时显示 02 而不是 01。
/// 向下取整的话，最后那个 00 会挂满整整一秒才归零，用户看到的是「归零了却还没结束」。
/// 显示毫秒时反过来用向下取整——毫秒本来就在跳，再进一位会直接看到数字倒着走。
CountdownParts countdownParts(int remaining, [bool showMilliseconds = false]) {
  final raw = remaining < 0 ? 0 : remaining;
  final ms = showMilliseconds ? raw : ((raw + 999) ~/ 1000) * 1000;
  return CountdownParts(
    days: ms ~/ 86400000,
    hours: (ms ~/ 3600000) % 24,
    minutes: (ms ~/ 60000) % 60,
    seconds: (ms ~/ 1000) % 60,
    milliseconds: raw % 1000,
  );
}

/// 按模板拼字符串。支持 DD / HH / mm / ss / SSS，以及不补零的 D / H / m / s。
///
/// 模板里没出现的那一位并进相邻的更小单位，而不是被丢掉：模板是 `mm:ss`
/// 而剩余超过一小时时，丢掉小时会显示成 `05:30`——看起来还有五分半，实际还有一小时零五分。
String formatCountdown(int remaining, [String format = 'HH:mm:ss']) {
  final p = countdownParts(remaining, format.contains('S'));

  var hours = p.hours;
  var minutes = p.minutes;
  var seconds = p.seconds;
  if (!format.contains('D')) hours += p.days * 24;
  if (!format.contains('H')) minutes += hours * 60;
  if (!format.contains('m')) seconds += minutes * 60;

  String pad(int n, [int width = 2]) => n.toString().padLeft(width, '0');

  // 先换长记号再换短记号：先换 D 的话，DD 会被拆成两段各自替换
  return format
      .replaceAll('DD', pad(p.days))
      .replaceAll('D', p.days.toString())
      .replaceAll('HH', pad(hours))
      .replaceAll('H', hours.toString())
      .replaceAll('mm', pad(minutes))
      .replaceAll('m', minutes.toString())
      .replaceAll('ss', pad(seconds))
      .replaceAll('s', seconds.toString())
      .replaceAll('SSS', pad(p.milliseconds, 3))
      .replaceAll('SS', pad(p.milliseconds ~/ 10))
      .replaceAll('S', (p.milliseconds ~/ 100).toString());
}

/// 下一次刷新该等多久。
///
/// 固定 1000ms 会累积漂移：一秒刷一次、每次晚几毫秒，几分钟后显示的秒数就跳格了。
/// 这里对齐到下一个整单位边界，让每一跳都落在该跳的时刻上。
int countdownInterval(int remaining, [bool millisecond = false]) {
  if (millisecond) return 50;
  final rest = remaining % 1000;
  return rest == 0 ? 1000 : rest;
}
