import 'package:flutter/material.dart';
import '../logic/chart.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_chart.dart';

/// 散点 / 气泡图。
///
/// 看的是两个连续量之间有没有关系——因此两个轴都必须写清楚在量什么，
/// 只标数字读者不知道自己在看什么。
///
/// 系列上限 3：折线与柱状里只有相邻系列会挨着，散点则是任意两点都可能贴着，
/// 配色要按所有两两组合校验，本体系的分类色在这个口径下只有前三槽同时通过。
/// 超出的系列合并成「其他」，而不是再调一个颜色把问题藏起来。
class IChartScatter extends StatefulWidget {
  const IChartScatter({
    super.key,
    required this.series,
    this.xLabel = '',
    this.yLabel = '',
    this.title = '',
    this.xUnit = '',
    this.yUnit = '',
    this.height = 280,
    this.trend = false,
  });

  final List<ScatterSeriesData> series;
  final String xLabel;
  final String yLabel;
  final String title;
  final String xUnit;
  final String yUnit;
  final double height;

  /// 叠加最小二乘拟合线与 R²
  final bool trend;

  @override
  State<IChartScatter> createState() => _IChartScatterState();
}

class _IChartScatterState extends State<IChartScatter> {
  List<ScatterSeriesData> get _shown {
    if (widget.series.length <= kScatterMaxSeries) return widget.series;
    final head = widget.series.take(kScatterMaxSeries - 1).toList();
    final rest = widget.series.skip(kScatterMaxSeries - 1);
    return [
      ...head,
      ScatterSeriesData(
        name: '其他',
        data: [for (final s in rest) ...s.data],
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final shown = _shown;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.title.isNotEmpty) ...[
          Text(
            widget.title,
            style: TextStyle(
              color: c.text,
              fontSize: IDesignTokensLight.fontSizeMd,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
        SizedBox(
          height: widget.height,
          child: CustomPaint(
            size: Size.infinite,
            painter: _ScatterPainter(
              series: shown,
              xLabel: widget.xLabel,
              yLabel: widget.yLabel,
              xUnit: widget.xUnit,
              yUnit: widget.yUnit,
              trend: widget.trend,
              colors: c,
            ),
          ),
        ),
        if (shown.length > 1) ...[
          const SizedBox(height: IDesignTokensLight.spacing3),
          Wrap(
            spacing: IDesignTokensLight.spacing4,
            children: [
              for (var i = 0; i < shown.length; i++)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: iChartPalette[i % kScatterMaxSeries],
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: IDesignTokensLight.spacing2),
                    Text(
                      shown[i].name,
                      style: TextStyle(
                        color: c.textSecondary,
                        fontSize: IDesignTokensLight.fontSizeSm,
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

class _ScatterPainter extends CustomPainter {
  const _ScatterPainter({
    required this.series,
    required this.xLabel,
    required this.yLabel,
    required this.xUnit,
    required this.yUnit,
    required this.trend,
    required this.colors,
  });

  final List<ScatterSeriesData> series;
  final String xLabel;
  final String yLabel;
  final String xUnit;
  final String yUnit;
  final bool trend;
  final IColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    const padTop = 16.0;
    const padRight = 16.0;
    const padBottom = 34.0;
    const padLeft = 52.0;
    final plotW = size.width - padLeft - padRight;
    final plotH = size.height - padTop - padBottom;
    if (plotW <= 0 || plotH <= 0) return;

    final points = [for (final s in series) ...s.data];
    if (points.isEmpty) return;
    final xE = extentOf(points.map((p) => p.x).toList());
    final yE = extentOf(points.map((p) => p.y).toList());
    final xTicks = niceTicks(xE.min, xE.max);
    final yTicks = niceTicks(yE.min, yE.max);
    final xMin = xTicks.first;
    final xMax = xTicks.last;
    final yMin = yTicks.first;
    final yMax = yTicks.last;

    double px(double v) => padLeft + (v - xMin) / (xMax - xMin) * plotW;
    double py(double v) => padTop + plotH - (v - yMin) / (yMax - yMin) * plotH;

    // 两个方向都要网格：散点要同时读出横纵两个坐标
    final grid = Paint()
      ..color = colors.hairline
      ..strokeWidth = 1;
    for (final tick in yTicks) {
      canvas.drawLine(Offset(padLeft, py(tick)), Offset(size.width - padRight, py(tick)), grid);
      _text(canvas, formatTick(tick), Offset(padLeft - 6, py(tick)), align: TextAlign.right);
    }
    for (final tick in xTicks) {
      canvas.drawLine(Offset(px(tick), padTop), Offset(px(tick), padTop + plotH), grid);
      _text(canvas, formatTick(tick), Offset(px(tick), padTop + plotH + 6), align: TextAlign.center);
    }
    if (xLabel.isNotEmpty) {
      _text(canvas, '$xLabel$xUnit', Offset(padLeft + plotW / 2, size.height - 14),
          align: TextAlign.center);
    }

    final sized = points.where((p) => p.size != null).map((p) => p.size!).toList();
    final sizeE = extentOf(sized);

    for (var i = 0; i < series.length; i++) {
      final color = iChartPalette[i % kScatterMaxSeries];

      // 拟合线画在点之下：它是参考，不该盖住数据
      if (trend) {
        final fit = trendLine(series[i].data);
        if (fit != null) {
          final line = Paint()
            ..color = color.withAlpha(178)
            ..strokeWidth = 1.5;
          // 裁到绘图区内：不裁的话斜率大的拟合线会冲出网格，像是坐标轴标错了
          canvas.save();
          canvas.clipRect(Rect.fromLTWH(padLeft, padTop, plotW, plotH));
          canvas.drawLine(
            Offset(px(xMin), py(fit.slope * xMin + fit.intercept)),
            Offset(px(xMax), py(fit.slope * xMax + fit.intercept)),
            line,
          );
          canvas.restore();
        }
      }

      for (final point in series[i].data) {
        final r = point.size == null ? 5.0 : bubbleRadius(point.size!, sizeE.min, sizeE.max);
        final center = Offset(px(point.x), py(point.y));
        // 先描一圈背景色：点密集时重叠处会糊成一块，有缝隙才数得清
        canvas.drawCircle(center, r, Paint()..color = color);
        canvas.drawCircle(
          center,
          r,
          Paint()
            ..color = colors.bg
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2,
        );
      }
    }
  }

  void _text(Canvas canvas, String value, Offset at, {TextAlign align = TextAlign.left}) {
    final painter = TextPainter(
      text: TextSpan(
        text: value,
        style: TextStyle(color: colors.textTertiary, fontSize: 11),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    final dx = switch (align) {
      TextAlign.right => at.dx - painter.width,
      TextAlign.center => at.dx - painter.width / 2,
      _ => at.dx,
    };
    final dy = align == TextAlign.center && at.dy > 0 ? at.dy : at.dy - painter.height / 2;
    painter.paint(canvas, Offset(dx, dy));
  }

  @override
  bool shouldRepaint(_ScatterPainter old) =>
      old.series != series || old.trend != trend || old.colors != colors;
}
