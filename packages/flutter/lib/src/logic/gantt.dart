/// 甘特图的时间轴与条形布局。
///
/// 与 packages/common/src/logic/gantt.ts 一一对应。
/// 时间域怎么定、一天占多宽、依赖箭头从哪儿拐弯——这三件事一旦让每端自己算
/// 就会各写各的，同一份排期在两个端上长得不一样。
library;

import 'calendar.dart' show addDays, parseISO, toISO;

class IGanttTask {
  const IGanttTask({
    required this.id,
    required this.name,
    required this.start,
    required this.end,
    this.progress,
    this.deps = const <String>[],
    this.milestone = false,
  });

  final String id;
  final String name;

  /// YYYY-MM-DD，含当天
  final String start;

  /// YYYY-MM-DD，含当天。与 start 相同表示只占一天
  final String end;

  /// 完成度 0–1；为空则不画进度层
  final double? progress;

  /// 依赖的任务 id：本任务要等它们完成
  final List<String> deps;

  /// 里程碑：零工期的时点，画成菱形而不是横条
  final bool milestone;
}

class IGanttBar {
  const IGanttBar({
    required this.task,
    required this.x,
    required this.width,
    required this.y,
    required this.height,
    required this.progressWidth,
    required this.overdue,
  });

  final IGanttTask task;
  final double x;
  final double width;
  final double y;
  final double height;

  /// 进度层的宽度，已按 progress 截断
  final double progressWidth;

  /// 结束日已过、但进度不足 1 —— 逾期
  final bool overdue;
}

class IGanttDomain {
  const IGanttDomain({required this.from, required this.to, required this.days});
  final String from;
  final String to;
  final int days;
}

class IGanttTick {
  const IGanttTick({required this.iso, required this.x, required this.label, required this.current});
  final String iso;
  final double x;
  final String label;

  /// 该周是否包含今天
  final bool current;
}

class IGanttLink {
  const IGanttLink({required this.id, required this.points});
  final String id;

  /// 折线点，[x1, y1, x2, y2, ...]
  final List<double> points;
}

/// 一天最少要占这么宽，否则条与条之间的间隙比条本身还显眼
const double kGanttMinDayWidth = 6;

/// 相差多少天（含首尾各算一天时需自行 +1）
int daysBetween(String from, String to) {
  final a = parseISO(from);
  final b = parseISO(to);
  if (a == null || b == null) return 0;
  // 按本地零点相减；不用 UTC 时间戳，跨夏令时的那一天会差出 23/25 小时
  return (b.difference(a).inHours / 24).round();
}

/// 时间域：把数据的最早/最晚各向外扩到整周。
///
/// 不贴着数据裁：贴边裁出来的图，第一根条紧贴左边框、最后一根紧贴右边框，
/// 看起来像被截断了；而且「这个项目从周几开始」在图上根本读不出来。
IGanttDomain ganttDomain(List<IGanttTask> tasks, {int weekStart = 1}) {
  final dates = <String>[];
  for (final t in tasks) {
    if (t.start.isNotEmpty) dates.add(t.start);
    if (t.end.isNotEmpty) dates.add(t.end);
  }
  dates.sort();
  if (dates.isEmpty) {
    final today = toISO(DateTime.now());
    return IGanttDomain(from: today, to: today, days: 1);
  }
  final first = parseISO(dates.first);
  final last = parseISO(dates.last);
  if (first == null || last == null) {
    return IGanttDomain(from: dates.first, to: dates.last, days: 1);
  }
  // Dart 的 weekday 是 1–7（周一起），JS 的 getDay 是 0–6（周日起），先对齐
  final firstDay = first.weekday % 7;
  final lastDay = last.weekday % 7;
  final back = (firstDay - weekStart + 7) % 7;
  final forward = 6 - ((lastDay - weekStart + 7) % 7);
  final from = toISO(addDays(first, -back));
  final to = toISO(addDays(last, forward));
  return IGanttDomain(from: from, to: to, days: daysBetween(from, to) + 1);
}

/// 排成横条。
///
/// 一行一个任务，不做自动压行：甘特图的行是有名字的，
/// 把两个任务挤进同一行会让左右对不上号。
List<IGanttBar> ganttBars(
  List<IGanttTask> tasks,
  IGanttDomain domain, {
  double dayWidth = 24,
  double rowHeight = 32,
  double barHeight = 18,
  String? today,
}) {
  final width = dayWidth > kGanttMinDayWidth ? dayWidth : kGanttMinDayWidth;
  final day = today ?? toISO(DateTime.now());
  final bars = <IGanttBar>[];
  for (var row = 0; row < tasks.length; row++) {
    final task = tasks[row];
    final offset = daysBetween(domain.from, task.start);
    // 含首尾：3 号到 5 号是三天，不是两天
    final rawSpan = daysBetween(task.start, task.end) + 1;
    final span = task.milestone ? 0 : (rawSpan < 1 ? 1 : rawSpan);
    final progress = (task.progress ?? 0).clamp(0.0, 1.0);
    final barWidth = span * width;
    bars.add(IGanttBar(
      task: task,
      x: offset * width,
      width: barWidth,
      y: row * rowHeight + (rowHeight - barHeight) / 2,
      height: barHeight,
      progressWidth: barWidth * progress,
      // 只看「结束日已过且没做完」。用开始日判定会把还没开工的未来任务也标成逾期
      overdue: !task.milestone && task.end.compareTo(day) < 0 && progress < 1,
    ));
  }
  return bars;
}

/// 时间轴刻度：一周一格，标注该周的第一天
List<IGanttTick> ganttTicks(IGanttDomain domain, {double dayWidth = 24, String? today}) {
  final width = dayWidth > kGanttMinDayWidth ? dayWidth : kGanttMinDayWidth;
  final start = parseISO(domain.from);
  if (start == null) return const <IGanttTick>[];
  final day = today ?? toISO(DateTime.now());
  final ticks = <IGanttTick>[];
  for (var d = 0; d < domain.days; d += 7) {
    final date = addDays(start, d);
    final iso = toISO(date);
    final endOfWeek = toISO(addDays(date, 6));
    ticks.add(IGanttTick(
      iso: iso,
      x: d * width,
      label: '${date.month}/${date.day}',
      current: iso.compareTo(day) <= 0 && day.compareTo(endOfWeek) <= 0,
    ));
  }
  return ticks;
}

/// 今天在图上的横坐标；不在时间域内返回 -1，调用方据此不画这条线
double ganttTodayX(IGanttDomain domain, {double dayWidth = 24, String? today}) {
  final day = today ?? toISO(DateTime.now());
  final offset = daysBetween(domain.from, day);
  if (offset < 0 || offset >= domain.days) return -1;
  return offset * (dayWidth > kGanttMinDayWidth ? dayWidth : kGanttMinDayWidth);
}

/// 依赖箭头的折线点。
///
/// 从前置任务的右端出发，绕到后继任务的左端。走折线而不是直线：
/// 直线会斜穿过中间几行的横条，读者分不清它连的是哪两根。
List<IGanttLink> ganttLinks(List<IGanttBar> bars, {double gap = 8}) {
  final byId = <String, IGanttBar>{for (final b in bars) b.task.id: b};
  final links = <IGanttLink>[];
  for (final bar in bars) {
    for (final dep in bar.task.deps) {
      final from = byId[dep];
      if (from == null) continue;
      final x1 = from.x + from.width;
      final y1 = from.y + from.height / 2;
      final x2 = bar.x;
      final y2 = bar.y + bar.height / 2;
      // 后继若排在前置左边（排期本身有问题），从前置右侧绕出去再折回来，
      // 而不是画一条穿回头的直线——那条线会盖住中间所有行
      final mid = x2 > x1 + gap * 2 ? x2 - gap : x1 + gap;
      links.add(IGanttLink(
        id: '$dep->${bar.task.id}',
        points: <double>[x1, y1, mid, y1, mid, y2, x2, y2],
      ));
    }
  }
  return links;
}

/// 拓扑校验：依赖是否成环。
///
/// 成环的排期画出来是一团互相指的箭头，看图的人只会以为是渲染坏了。
/// 返回环上的任务 id，让调用方能直接指出是哪几个。
List<String> ganttCycle(List<IGanttTask> tasks) {
  final byId = <String, IGanttTask>{for (final t in tasks) t.id: t};
  final state = <String, int>{};
  final stack = <String>[];

  List<String>? visit(String id) {
    if (state[id] == 2) return null;
    if (state[id] == 1) return stack.sublist(stack.indexOf(id));
    state[id] = 1;
    stack.add(id);
    for (final dep in byId[id]?.deps ?? const <String>[]) {
      if (!byId.containsKey(dep)) continue;
      final cycle = visit(dep);
      if (cycle != null) return cycle;
    }
    stack.removeLast();
    state[id] = 2;
    return null;
  }

  for (final task in tasks) {
    final cycle = visit(task.id);
    if (cycle != null) return cycle;
  }
  return const <String>[];
}
