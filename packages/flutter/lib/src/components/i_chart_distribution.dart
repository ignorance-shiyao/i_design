import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../logic/chart.dart';
import '../logic/stats.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum IDistributionType { histogram, density, violin, error }

/// 分布图：直方 / 密度 / 小提琴 / 误差棒（astra.md 的 D04）。
///
/// 分箱、核密度、误差棒的计算走 logic/stats.dart，与 Web 端同源——
/// 分布图的形状就是它的全部内容，各端各算一遍等于画出两张不同的图。
///
/// 会改变结论的数字（箱宽、带宽、误差棒的含义）印在图下，不留给读者猜。
class IChartDistribution extends StatelessWidget {
  const IChartDistribution({
    super.key,
    required this.values,
    this.type = IDistributionType.histogram,
    this.rule = 'freedman-diaconis',
    this.binWidth,
    this.bandwidth,
    this.errorKind = 'sd',
    this.height = 220,
    this.title = '',
    this.unit = '',
  });

  /// 原始样本。分布图吃的是样本本身，不是聚合过的值
  final List<double> values;
  final IDistributionType type;

  /// 分箱规则。fixed 时必须给 binWidth
  final String rule;
  final double? binWidth;

  /// 核密度带宽。不给则按 Silverman 经验法则算
  final double? bandwidth;

  /// 误差棒的含义：sd / sem / ci95，三者说的不是一回事
  final String errorKind;
  final double height;
  final String title;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final hist = type == IDistributionType.histogram
        ? histogram(values, rule: rule, width: binWidth)
        : null;
    final density = type == IDistributionType.density ? kde(values, bandwidth: bandwidth) : null;
    final violin =
        type == IDistributionType.violin ? violinShape(values, bandwidth: bandwidth) : null;
    final bar = type == IDistributionType.error ? errorBar(values, errorKind) : null;

    final caption = switch (type) {
      IDistributionType.histogram => '${hist!.count} 个样本，${hist.bins.length} 个箱，'
          '箱宽 ${formatTick(hist.width)}$unit（${hist.rule == 'freedman-diaconis' ? 'Freedman–Diaconis' : hist.rule == 'sturges' ? 'Sturges' : '固定宽度'}）',
      IDistributionType.density =>
        '${values.length} 个样本，带宽 ${formatTick(density!.bandwidth)}$unit（Silverman）',
      IDistributionType.violin =>
        '${values.length} 个样本，带宽 ${formatTick(violin!.bandwidth)}$unit；宽度按峰值归一化',
      IDistributionType.error => bar!.caption,
    };

    final issues = [
      ...?hist?.issues,
      ...?density?.issues,
      ...?violin?.issues,
    ];

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
            painter: _DistributionPainter(
              values: values.where((v) => v.isFinite).toList(),
              hist: hist,
              density: density,
              violin: violin,
              bar: bar,
              colors: c,
            ),
          ),
        ),
        const SizedBox(height: IDesignTokensLight.spacing2),
        // 会改变结论的数字写在图下：箱宽、带宽、误差棒的含义
        Text(
          caption,
          style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeXs),
        ),
        for (final issue in issues)
          Text(
            issue.message,
            style: TextStyle(color: c.warning, fontSize: IDesignTokensLight.fontSizeXs),
          ),
      ],
    );
  }
}

class _DistributionPainter extends CustomPainter {
  const _DistributionPainter({
    required this.values,
    required this.hist,
    required this.density,
    required this.violin,
    required this.bar,
    required this.colors,
  });

  final List<double> values;
  final IHistogram? hist;
  final IDensity? density;
  final IViolinShape? violin;
  final IErrorBar? bar;
  final IColors colors;

  static const double padLeft = 44;
  static const double padRight = 12;
  static const double padTop = 12;
  static const double padBottom = 28;

  void _text(Canvas canvas, String text, Offset at, Color color) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: TextStyle(color: color, fontSize: 11)),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(canvas, Offset(at.dx - painter.width / 2, at.dy));
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) return;
    final plotW = size.width - padLeft - padRight;
    final plotH = size.height - padTop - padBottom;

    var min = values.reduce(math.min);
    var max = values.reduce(math.max);
    if (bar != null) {
      min = math.min(min, bar!.low);
      max = math.max(max, bar!.high);
    }
    if (density != null && density!.points.isNotEmpty) {
      min = density!.points.first.x;
      max = density!.points.last.x;
    }
    final ticks = niceTicks(min, max, 5);
    final lo = ticks.first;
    final hi = ticks.last;
    double x(double v) => padLeft + ((v - lo) / ((hi - lo) == 0 ? 1 : hi - lo)) * plotW;

    final grid = Paint()
      ..color = colors.hairline
      ..strokeWidth = 1;
    for (final tick in ticks) {
      canvas.drawLine(Offset(x(tick), padTop), Offset(x(tick), padTop + plotH), grid);
      _text(canvas, formatTick(tick), Offset(x(tick), size.height - padBottom + 6), colors.textTertiary);
    }

    final brand = IDesignTokensLight.chart1;
    final mid = padTop + plotH / 2;

    if (hist != null) {
      final maxCount = hist!.bins.fold<int>(1, (m, b) => math.max(m, b.count));
      final paint = Paint()..color = brand;
      for (final bin in hist!.bins) {
        final h = (bin.count / maxCount) * plotH;
        // 相邻箱之间留一像素缝：色觉障碍下它比颜色更可靠
        canvas.drawRect(
          Rect.fromLTWH(
            x(bin.from) + 0.5,
            padTop + plotH - h,
            math.max(1, x(bin.to) - x(bin.from) - 1),
            h,
          ),
          paint,
        );
      }
    } else if (density != null && density!.points.isNotEmpty) {
      final peak = density!.points.fold<double>(1e-9, (m, p) => math.max(m, p.y));
      final path = Path();
      for (var i = 0; i < density!.points.length; i += 1) {
        final p = density!.points[i];
        final py = padTop + plotH - (p.y / peak) * plotH;
        if (i == 0) {
          path.moveTo(x(p.x), py);
        } else {
          path.lineTo(x(p.x), py);
        }
      }
      canvas.drawPath(
        path,
        Paint()
          ..color = brand
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2,
      );
    } else if (violin != null && violin!.points.isNotEmpty) {
      // 宽度按峰值归一化：两把琴的「胖」才可比
      final peak = violin!.peak == 0 ? 1.0 : violin!.peak;
      final path = Path();
      for (var i = 0; i < violin!.points.length; i += 1) {
        final p = violin!.points[i];
        final half = (p.density / peak) * (plotH / 2);
        if (i == 0) {
          path.moveTo(x(p.value), mid - half);
        } else {
          path.lineTo(x(p.value), mid - half);
        }
      }
      for (var i = violin!.points.length - 1; i >= 0; i -= 1) {
        final p = violin!.points[i];
        path.lineTo(x(p.value), mid + (p.density / peak) * (plotH / 2));
      }
      path.close();
      canvas.drawPath(
        path,
        Paint()..color = Color.fromRGBO(brand.red, brand.green, brand.blue, 0.28),
      );
      canvas.drawPath(
        path,
        Paint()
          ..color = brand
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5,
      );
    } else if (bar != null) {
      final paint = Paint()
        ..color = brand
        ..strokeWidth = 2;
      canvas.drawLine(Offset(x(bar!.low), mid), Offset(x(bar!.high), mid), paint);
      canvas.drawLine(Offset(x(bar!.low), mid - 10), Offset(x(bar!.low), mid + 10), paint);
      canvas.drawLine(Offset(x(bar!.high), mid - 10), Offset(x(bar!.high), mid + 10), paint);
      canvas.drawCircle(Offset(x(bar!.mean), mid), 5, Paint()..color = brand);
    }
  }

  @override
  bool shouldRepaint(_DistributionPainter old) =>
      old.values != values || old.colors != colors || old.bar != bar;
}
