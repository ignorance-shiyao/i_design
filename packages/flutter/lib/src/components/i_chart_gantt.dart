import 'package:flutter/material.dart';
import '../logic/gantt.dart';

/// 甘特图。
///
/// 排期图回答的是「谁挡着谁、现在落后了没有」，因此依赖线与今天这条竖线是主体，
/// 横条只是把工期画出来。时间域、条形坐标与依赖折线全部来自 logic/gantt，
/// 与其余端逐值一致。
class IChartGantt extends StatelessWidget {
  const IChartGantt({
    super.key,
    required this.tasks,
    this.title = '',
    this.dayWidth = 18,
    this.rowHeight = 34,
    this.today,
    this.nameWidth = 132,
  });

  final List<IGanttTask> tasks;
  final String title;

  /// 一天占多少像素。周期长的排期调小它，一屏就能看全
  final double dayWidth;
  final double rowHeight;

  /// 覆盖「今天」，主要用于让截图与测试稳定
  final String? today;
  final double nameWidth;

  static const double _headerH = 28;
  static const double _barH = 18;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final domain = ganttDomain(tasks);
    final bars = ganttBars(tasks, domain,
        dayWidth: dayWidth, rowHeight: rowHeight, barHeight: _barH, today: today);
    final cycle = ganttCycle(tasks);
    final chartW = domain.days * dayWidth;
    final chartH = tasks.length * rowHeight;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        if (title.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(title, style: theme.textTheme.titleSmall),
          ),

        // 数据有环时明说，而不是画一张读不出结论的图。图标 + 文字，颜色不是唯一线索
        if (cycle.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: <Widget>[
                Icon(Icons.error_outline, size: 16, color: theme.colorScheme.error),
                const SizedBox(width: 6),
                Expanded(
                  child: Text('任务 ${cycle.join(' → ')} 的依赖构成了环，已不画依赖线',
                      style: theme.textTheme.bodySmall),
                ),
              ],
            ),
          ),

        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            // 任务名固定在左侧：横向滚动时跟着走的话，滚出去就对不上是哪一行了
            SizedBox(
              width: nameWidth,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  SizedBox(
                    height: _headerH,
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text('任务', style: theme.textTheme.labelSmall),
                    ),
                  ),
                  for (final task in tasks)
                    SizedBox(
                      height: rowHeight,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(task.name,
                            overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: CustomPaint(
                  size: Size(chartW, chartH + _headerH),
                  painter: _GanttPainter(
                    tasks: tasks,
                    domain: domain,
                    bars: bars,
                    // 成环时不画依赖线
                    links: cycle.isEmpty ? ganttLinks(bars) : const <IGanttLink>[],
                    ticks: ganttTicks(domain, dayWidth: dayWidth, today: today),
                    todayX: ganttTodayX(domain, dayWidth: dayWidth, today: today),
                    scheme: theme.colorScheme,
                    labelStyle: theme.textTheme.labelSmall ?? const TextStyle(fontSize: 11),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _GanttPainter extends CustomPainter {
  _GanttPainter({
    required this.tasks,
    required this.domain,
    required this.bars,
    required this.links,
    required this.ticks,
    required this.todayX,
    required this.scheme,
    required this.labelStyle,
  });

  final List<IGanttTask> tasks;
  final IGanttDomain domain;
  final List<IGanttBar> bars;
  final List<IGanttLink> links;
  final List<IGanttTick> ticks;
  final double todayX;
  final ColorScheme scheme;
  final TextStyle labelStyle;

  static const double _headerH = IChartGantt._headerH;
  static const double _barH = IChartGantt._barH;

  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()
      ..color = scheme.outlineVariant
      ..strokeWidth = 1;

    // 周分隔线在最底层，压不住任何数据
    for (final tick in ticks) {
      canvas.drawLine(Offset(tick.x, 0), Offset(tick.x, size.height), grid);
      final tp = TextPainter(
        text: TextSpan(
          text: tick.label,
          style: labelStyle.copyWith(color: tick.current ? scheme.primary : scheme.outline),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(tick.x + 4, 6));
    }

    // 今天：一条虚线，位置本身就是信息，不需要文字标注
    if (todayX >= 0) {
      final dash = Paint()
        ..color = scheme.primary
        ..strokeWidth = 1.5;
      for (var y = _headerH; y < size.height; y += 6) {
        canvas.drawLine(Offset(todayX, y), Offset(todayX, y + 3), dash);
      }
    }

    // 依赖线走折线：直线会斜穿过中间几行的横条，读者分不清连的是哪两根
    final linkPaint = Paint()
      ..color = scheme.outline.withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (final link in links) {
      final path = Path()..moveTo(link.points[0], link.points[1] + _headerH);
      for (var i = 2; i < link.points.length; i += 2) {
        path.lineTo(link.points[i], link.points[i + 1] + _headerH);
      }
      canvas.drawPath(path, linkPaint);
    }

    for (final bar in bars) {
      final y = bar.y + _headerH;
      if (bar.task.milestone) {
        // 里程碑是零工期的时点，画成菱形：一天宽的横条会被当成一天的工作量
        final cy = y + _barH / 2;
        final path = Path()
          ..moveTo(bar.x, cy - 8)
          ..lineTo(bar.x + 8, cy)
          ..lineTo(bar.x, cy + 8)
          ..lineTo(bar.x - 8, cy)
          ..close();
        canvas.drawPath(path, Paint()..color = scheme.onSurface);
        continue;
      }
      // 逾期换警示色；调用方仍应在表里写明「已逾期」，颜色不作为唯一线索
      final base = bar.overdue ? scheme.error : scheme.primary;
      final track = RRect.fromRectAndRadius(
        Rect.fromLTWH(bar.x, y, bar.width, _barH),
        const Radius.circular(3),
      );
      canvas.drawRRect(track, Paint()..color = base.withValues(alpha: 0.18));
      if (bar.progressWidth > 0) {
        // 进度层叠在轨道上，同色更深；只用长度表示完成度，不另起一种颜色
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(bar.x, y, bar.progressWidth, _barH),
            const Radius.circular(3),
          ),
          Paint()..color = base,
        );
      }
    }
  }

  @override
  bool shouldRepaint(_GanttPainter old) =>
      old.tasks != tasks || old.todayX != todayX || old.bars.length != bars.length;
}
