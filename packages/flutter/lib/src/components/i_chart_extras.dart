import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../logic/chart.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_chart.dart';

/// 顺序色阶：表示量级，同一色相由浅到深。
/// 与分类色不同，它编码的是「多少」，因此不能用多色相。
const List<Color> iChartSequential = [
  IDesignTokensLight.chartSeq1,
  IDesignTokensLight.chartSeq2,
  IDesignTokensLight.chartSeq3,
  IDesignTokensLight.chartSeq4,
  IDesignTokensLight.chartSeq5,
];

@immutable
class IFunnelStage {
  const IFunnelStage({required this.name, required this.value});

  final String name;
  final double value;
}

/// 转化漏斗。
///
/// 每层旁边写的是相对上一层的转化率——漏斗要回答的是「在哪一步流失最多」，
/// 只写占起点的百分比答不了这个问题。层级有序，因此用单色阶而不是分类色。
class IChartFunnel extends StatelessWidget {
  const IChartFunnel({
    super.key,
    required this.stages,
    this.title = '',
    this.unit = '',
    this.height = 200,
  });

  final List<IFunnelStage> stages;
  final String title;
  final String unit;
  final double height;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final shapes = funnelShapes(stages.map((s) => s.value).toList(), 300, height);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          Text(
            title,
            style: TextStyle(
              color: c.text,
              fontSize: IDesignTokensLight.fontSizeMd,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
        SizedBox(
          height: height,
          child: CustomPaint(
            size: Size.infinite,
            painter: _FunnelPainter(values: stages.map((s) => s.value).toList(), surface: c.bg),
          ),
        ),
        const SizedBox(height: IDesignTokensLight.spacing3),
        for (var i = 0; i < stages.length; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing1),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: iChartSequential[math.min(4, i)],
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(width: IDesignTokensLight.spacing2),
                Expanded(
                  child: Text(
                    stages[i].name,
                    style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm),
                  ),
                ),
                Text(
                  '${formatTick(stages[i].value)}$unit',
                  style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm),
                ),
                const SizedBox(width: IDesignTokensLight.spacing3),
                Text(
                  i == 0 ? '起点' : '较上一步 ${(shapes[i].step * 100).toStringAsFixed(1)}%',
                  style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _FunnelPainter extends CustomPainter {
  const _FunnelPainter({required this.values, required this.surface});

  final List<double> values;
  final Color surface;

  @override
  void paint(Canvas canvas, Size size) {
    final shapes = funnelShapes(values, size.width, size.height);
    for (var i = 0; i < shapes.length; i++) {
      final s = shapes[i];
      final path = Path()
        ..moveTo((size.width - s.topWidth) / 2, s.y)
        ..lineTo((size.width + s.topWidth) / 2, s.y)
        ..lineTo((size.width + s.bottomWidth) / 2, s.y + s.height)
        ..lineTo((size.width - s.bottomWidth) / 2, s.y + s.height)
        ..close();
      canvas.drawPath(path, Paint()..color = iChartSequential[math.min(4, i)]);
      canvas.drawPath(
        path,
        Paint()
          ..color = surface
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2,
      );
    }
  }

  @override
  bool shouldRepaint(_FunnelPainter old) => old.values != values;
}

/// 仪表盘：一个值离目标还有多远。
class IChartGauge extends StatelessWidget {
  const IChartGauge({
    super.key,
    required this.value,
    this.min = 0,
    this.max = 100,
    this.size = 160,
    this.title = '',
    this.unit = '',
    this.thresholds = const [],
  });

  final double value;
  final double min;
  final double max;
  final double size;
  final String title;
  final String unit;

  /// 阈值：越过即转为对应状态色
  final List<({double value, String status})> thresholds;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final percent = max == min ? 0.0 : (value - min) / (max - min);

    final sorted = [...thresholds]..sort((a, b) => a.value.compareTo(b.value));
    final hit = sorted.where((t) => value >= t.value).isEmpty
        ? null
        : sorted.where((t) => value >= t.value).last;
    final color = switch (hit?.status) {
      'success' => c.success,
      'warning' => c.warning,
      'danger' => c.danger,
      _ => c.brand,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          Text(
            title,
            style: TextStyle(
              color: c.text,
              fontSize: IDesignTokensLight.fontSizeMd,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
        SizedBox(
          width: size,
          height: size * 0.78,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: Size.square(size),
                painter: _GaugePainter(
                  percent: percent.clamp(0, 1).toDouble(),
                  color: color,
                  track: c.bgMuted,
                  stroke: math.max(8, size * 0.09),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${formatTick(value)}$unit',
                    style: TextStyle(
                      color: color,
                      fontSize: IDesignTokensLight.fontSize2xl,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '${formatTick(min)} – ${formatTick(max)}$unit',
                    style: TextStyle(
                      color: c.textTertiary,
                      fontSize: IDesignTokensLight.fontSizeXs,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _GaugePainter extends CustomPainter {
  const _GaugePainter({
    required this.percent,
    required this.color,
    required this.track,
    required this.stroke,
  });

  final double percent;
  final Color color;
  final Color track;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromCircle(
      center: Offset(size.width / 2, size.width / 2),
      radius: size.width / 2 - stroke / 2,
    );
    canvas.drawArc(
      rect,
      kGaugeStart,
      kGaugeSweep,
      false,
      Paint()
        ..color = track
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round,
    );
    if (percent <= 0) return;
    canvas.drawArc(
      rect,
      kGaugeStart,
      kGaugeSweep * percent,
      false,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_GaugePainter old) => old.percent != percent || old.color != color;
}

@immutable
class IRadarSeries {
  const IRadarSeries({required this.name, required this.data});

  final String name;
  final List<double> data;
}

/// 雷达图：同一对象在多个维度上的形状。
///
/// 多系列只描边不填充——两层半透明填充叠在一起是混合色，读者对不回图例。
class IChartRadar extends StatelessWidget {
  const IChartRadar({
    super.key,
    required this.axes,
    required this.series,
    this.max = 0,
    this.size = 220,
    this.title = '',
  });

  final List<String> axes;
  final List<IRadarSeries> series;
  final double max;
  final double size;
  final String title;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final maxValue = max > 0
        ? max
        : math.max(1, series.expand((s) => s.data).fold<double>(0, math.max));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          Text(
            title,
            style: TextStyle(
              color: c.text,
              fontSize: IDesignTokensLight.fontSizeMd,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
        Center(
          child: SizedBox(
            width: size,
            height: size,
            child: CustomPaint(
              painter: _RadarPainter(
                axes: axes,
                series: series,
                maxValue: maxValue,
                grid: c.hairline,
                label: c.textTertiary,
                filled: series.length == 1,
              ),
            ),
          ),
        ),
        if (series.length > 1) ...[
          const SizedBox(height: IDesignTokensLight.spacing3),
          Wrap(
            spacing: IDesignTokensLight.spacing4,
            children: [
              for (var i = 0; i < series.length; i++)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: iChartPalette[i % iChartPalette.length],
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    const SizedBox(width: IDesignTokensLight.spacing2),
                    Text(
                      series[i].name,
                      style: TextStyle(
                        color: c.textSecondary,
                        fontSize: IDesignTokensLight.fontSizeXs,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ],
    );
  }
}

class _RadarPainter extends CustomPainter {
  const _RadarPainter({
    required this.axes,
    required this.series,
    required this.maxValue,
    required this.grid,
    required this.label,
    required this.filled,
  });

  final List<String> axes;
  final List<IRadarSeries> series;
  final double maxValue;
  final Color grid;
  final Color label;
  final bool filled;

  @override
  void paint(Canvas canvas, Size size) {
    // 半径要给维度名让位：留太少时最外侧的名字会被画布裁掉
    final longest = axes.fold<int>(4, (n, a) => a.length > n ? a.length : n);
    final radius = size.width / 2 - math.min(size.width * 0.28, longest * 12) - 12;
    final center = Offset(size.width / 2, size.height / 2);
    final origin = Offset(center.dx - radius, center.dy - radius);

    Path polygon(List<Offset> points) {
      final path = Path();
      for (var i = 0; i < points.length; i++) {
        final p = points[i] + origin;
        i == 0 ? path.moveTo(p.dx, p.dy) : path.lineTo(p.dx, p.dy);
      }
      return path..close();
    }

    final gridPaint = Paint()
      ..color = grid
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    for (final ring in [0.25, 0.5, 0.75, 1.0]) {
      canvas.drawPath(
        polygon(radarPoints([for (final _ in axes) maxValue * ring], maxValue, radius)),
        gridPaint,
      );
    }
    for (final point in radarPoints([for (final _ in axes) maxValue], maxValue, radius)) {
      canvas.drawLine(center, point + origin, gridPaint);
    }

    for (var si = 0; si < series.length; si++) {
      final color = iChartPalette[si % iChartPalette.length];
      final points = radarPoints(series[si].data, maxValue, radius);
      final path = polygon(points);
      if (filled) {
        canvas.drawPath(
          path,
          Paint()..color = Color.fromRGBO(color.red, color.green, color.blue, 0.18),
        );
      }
      canvas.drawPath(
        path,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..strokeJoin = StrokeJoin.round,
      );
      for (final point in points) {
        canvas.drawCircle(point + origin, 3, Paint()..color = color);
      }
    }

    for (var i = 0; i < axes.length; i++) {
      final angle = -math.pi / 2 + (i / axes.length) * math.pi * 2;
      final painter = TextPainter(
        text: TextSpan(text: axes[i], style: TextStyle(color: label, fontSize: 11)),
        textDirection: TextDirection.ltr,
      )..layout();
      final at = Offset(
        center.dx + (radius + 14) * math.cos(angle),
        center.dy + (radius + 14) * math.sin(angle),
      );
      // 按位置对齐：一律居中会让最外侧的名字超出画布
      final dx = math.cos(angle).abs() < 0.2
          ? at.dx - painter.width / 2
          : (math.cos(angle) > 0 ? at.dx : at.dx - painter.width);
      painter.paint(canvas, Offset(dx, at.dy - painter.height / 2));
    }
  }

  @override
  bool shouldRepaint(_RadarPainter old) => old.series != series || old.maxValue != maxValue;
}

/// 热力图：二维密度。
///
/// 单色阶而不是彩虹——彩虹会让读者以为不同颜色代表不同类别，而不是多与少。
/// 深色格子上的数字自动转为反色，任何一格都读得出来。
class IChartHeatmap extends StatelessWidget {
  const IChartHeatmap({
    super.key,
    required this.matrix,
    required this.rows,
    required this.columns,
    this.title = '',
    this.unit = '',
  });

  final List<List<double>> matrix;
  final List<String> rows;
  final List<String> columns;
  final String title;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final flat = matrix.expand((r) => r).toList();
    if (flat.isEmpty) return const SizedBox.shrink();
    final min = flat.reduce(math.min);
    final max = flat.reduce(math.max);

    Widget cell(double value) {
      final level = heatLevel(value, min, max, 5);
      return Container(
        margin: const EdgeInsets.all(1),
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing2,
          vertical: IDesignTokensLight.spacing2,
        ),
        decoration: BoxDecoration(
          color: iChartSequential[level],
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
        ),
        child: Text(
          formatTick(value),
          textAlign: TextAlign.center,
          style: TextStyle(
            // 深色格子换反色文字，浅色格子用正常文字
            color: level >= 3 ? c.textInverse : c.text,
            fontSize: IDesignTokensLight.fontSizeXs,
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          Text(
            title,
            style: TextStyle(
              color: c.text,
              fontSize: IDesignTokensLight.fontSizeMd,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const SizedBox(width: 48),
                  for (final column in columns)
                    SizedBox(
                      width: 52,
                      child: Text(
                        column,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: c.textTertiary,
                          fontSize: IDesignTokensLight.fontSizeXs,
                        ),
                      ),
                    ),
                ],
              ),
              for (var r = 0; r < rows.length; r++)
                Row(
                  children: [
                    SizedBox(
                      width: 48,
                      child: Text(
                        rows[r],
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          color: c.textTertiary,
                          fontSize: IDesignTokensLight.fontSizeXs,
                        ),
                      ),
                    ),
                    for (final value in matrix[r]) SizedBox(width: 52, child: cell(value)),
                  ],
                ),
            ],
          ),
        ),
        const SizedBox(height: IDesignTokensLight.spacing3),
        // 图例说明色深对应的量级；没有它，颜色只是好看而不可读
        Row(
          children: [
            Text(
              '${formatTick(min)}$unit',
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
            ),
            const SizedBox(width: IDesignTokensLight.spacing2),
            for (final color in iChartSequential)
              Container(
                width: 22,
                height: 10,
                margin: const EdgeInsets.only(right: 2),
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
              ),
            const SizedBox(width: IDesignTokensLight.spacing2),
            Text(
              '${formatTick(max)}$unit',
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
            ),
          ],
        ),
      ],
    );
  }
}
