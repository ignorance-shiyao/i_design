import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../logic/axis.dart';
import '../logic/chart.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

@immutable
class IChartSeries {
  const IChartSeries({required this.name, required this.data});

  final String name;
  final List<double> data;
}

enum IChartType { line, area, bar }

/// 分类色：与 Web 端同一批取值、同一个顺序。
///
/// 顺序本身就是色觉安全机制，因此按序分配、绝不循环；
/// 第九个系列不再生成新颜色，而应合并为「其他」。
const List<Color> iChartPalette = [
  IDesignTokensLight.chart1,
  IDesignTokensLight.chart2,
  IDesignTokensLight.chart3,
  IDesignTokensLight.chart4,
  IDesignTokensLight.chart5,
  IDesignTokensLight.chart6,
  IDesignTokensLight.chart7,
  IDesignTokensLight.chart8,
];

/// 折线 / 面积 / 柱状图。
///
/// 刻度与比例尺来自 logic/chart.dart，与 Web 端同源；
/// 柱状图恒从零起——截断基线会放大差异，是最常见的图表误导。
class IChart extends StatelessWidget {
  const IChart({
    super.key,
    required this.series,
    required this.labels,
    this.type = IChartType.line,
    this.stacked = false,
    this.percent = false,
    this.curve = 'linear',
    this.target,
    this.orientation = IAxisOrientation.vertical,
    this.rank = 'none',
    this.height = 220,
    this.fromZero = true,
    this.title = '',
    this.unit = '',
  });

  final List<IChartSeries> series;
  final List<String> labels;
  final IChartType type;

  /// 柱状与面积：堆叠而不是并排／覆盖
  final bool stacked;

  /// 百分比堆叠：整列为 0 或含负值的列不换算（见 logic/chart.dart 的 iPercentStack）
  final bool percent;

  /// 折线画法：step 适合「值在两次采样之间保持不变」的量
  final String curve;

  /// 目标线：要达到的值。与阈值分开——把目标画成危险色会让它看起来像故障
  final double? target;

  /// 柱状图的方向。horizontal 把值轴放到水平方向、类目轴放到垂直方向：
  /// 类目名一长，纵向柱的标签只能隔一个显示，横条的标签正着写就读得下去。
  /// 其它图型忽略它——折线横过来读者会把「时间」读成「量」。
  final IAxisOrientation orientation;

  /// 横条按值排序。类目本身有顺序（星期、档位）时排序反而破坏信息，所以不是默认。
  final String rank;
  final double height;
  final bool fromZero;
  final String title;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

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
            painter: _ChartPainter(
              // 百分比换算在这里做，与 Web 端同一份实现（iPercentStack）
              series: percent
                  ? () {
                      final converted = iPercentStack([for (final s in series) s.data]);
                      return [
                        for (var i = 0; i < series.length; i += 1)
                          IChartSeries(name: series[i].name, data: converted.data[i])
                      ];
                    }()
                  : series,
              labels: labels,
              type: type,
              stacked: stacked,
              fromZero: fromZero,
              curve: curve,
              target: target,
              orientation: orientation,
              rank: rank,
              colors: c,
            ),
          ),
        ),
        // 两个以上系列必有图例：颜色不能是识别身份的唯一通道
        if (series.length > 1) ...[
          const SizedBox(height: IDesignTokensLight.spacing3),
          Wrap(
            spacing: IDesignTokensLight.spacing4,
            runSpacing: IDesignTokensLight.spacing2,
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

class _ChartPainter extends CustomPainter {
  const _ChartPainter({
    required this.series,
    required this.labels,
    required this.type,
    required this.stacked,
    required this.curve,
    required this.target,
    required this.orientation,
    required this.rank,
    required this.fromZero,
    required this.colors,
  });

  final List<IChartSeries> series;
  final List<String> labels;
  final IChartType type;
  final bool stacked;
  final String curve;
  final double? target;
  final IAxisOrientation orientation;
  final String rank;
  final bool fromZero;
  final IColors colors;

  static const double padLeft = 44;
  static const double padRight = 12;
  static const double padTop = 12;
  static const double padBottom = 24;

  void _text(Canvas canvas, String text, Offset at, Color color, {TextAlign align = TextAlign.left}) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: TextStyle(color: color, fontSize: 11)),
      textDirection: TextDirection.ltr,
      textAlign: align,
    )..layout();
    final dx = align == TextAlign.right
        ? at.dx - painter.width
        : align == TextAlign.center
            ? at.dx - painter.width / 2
            : at.dx;
    painter.paint(canvas, Offset(dx, at.dy));
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (series.isEmpty || labels.isEmpty) return;

    final horizontal = type == IChartType.bar && orientation == IAxisOrientation.horizontal;
    // 横条的类目名写在左边，44px 只够放数字刻度
    final left = horizontal ? 96.0 : padLeft;
    final plotW = size.width - left - padRight;
    final plotH = size.height - padTop - padBottom;

    if (horizontal) {
      _paintHorizontal(canvas, size, left, plotW, plotH);
      return;
    }

    final isBar = type == IChartType.bar;
    final stackedArea = type == IChartType.area && series.length > 1;

    final domain = domainOf(
      series.map((s) => s.data).toList(),
      fromZero: isBar ? true : fromZero,
      stacked: (isBar && stacked) || stackedArea,
    );
    final ticks = niceTicks(domain.min, domain.max, 5);
    final lo = ticks.first;
    final hi = ticks.last;

    double y(double v) => scaleY(v, lo, hi, plotH) + padTop;
    double x(int i) => scaleX(i, labels.length, plotW) + padLeft;

    // 网格与刻度：背景信息，用最淡的一档
    final grid = Paint()
      ..color = colors.hairline
      ..strokeWidth = 1;
    for (final tick in ticks) {
      canvas.drawLine(Offset(padLeft, y(tick)), Offset(size.width - padRight, y(tick)), grid);
      _text(canvas, formatTick(tick), Offset(padLeft - 6, y(tick) - 7), colors.textTertiary,
          align: TextAlign.right);
    }
    canvas.drawLine(
      Offset(padLeft, y(math.max(lo, 0))),
      Offset(size.width - padRight, y(math.max(lo, 0))),
      Paint()
        ..color = colors.border
        ..strokeWidth = 1,
    );

    final band = plotW / math.max(1, labels.length);
    for (var i = 0; i < labels.length; i++) {
      // 标签多时隔一个显示，避免叠字
      if (labels.length > 8 && i.isOdd) continue;
      _text(
        canvas,
        labels[i],
        Offset(isBar ? padLeft + band * (i + 0.5) : x(i), size.height - padBottom + 6),
        colors.textTertiary,
        align: TextAlign.center,
      );
    }

    double below(int i, int si) => series
        .take(si)
        .fold<double>(0, (sum, s) => sum + (i < s.data.length ? s.data[i] : 0));

    if (isBar) {
      final barW = stacked ? band * 0.5 : (band * 0.62) / series.length;
      for (var si = 0; si < series.length; si++) {
        final paint = Paint()..color = iChartPalette[si % iChartPalette.length];
        for (var i = 0; i < series[si].data.length; i++) {
          final value = series[si].data[i];
          final left = stacked
              ? padLeft + band * i + (band - barW) / 2
              : padLeft + band * i + (band - barW * series.length) / 2 + si * barW;
          final top = stacked ? y(below(i, si) + value) : y(math.max(0, value));
          final bottom = stacked ? y(below(i, si)) : y(0);
          // 只有堆叠最上面一段是圆角：中间段也圆会看起来像一颗颗独立的胶囊
          final isTop = !stacked || si == series.length - 1;
          canvas.drawRRect(
            RRect.fromRectAndCorners(
              Rect.fromLTRB(left, top, left + barW, bottom),
              topLeft: Radius.circular(isTop ? 3 : 0),
              topRight: Radius.circular(isTop ? 3 : 0),
            ),
            paint,
          );
          // 相邻填充之间留缝隙：色觉障碍下它比颜色更可靠
          canvas.drawRRect(
            RRect.fromRectAndCorners(Rect.fromLTRB(left, top, left + barW, bottom)),
            Paint()
              ..color = colors.bg
              ..style = PaintingStyle.stroke
              ..strokeWidth = 2,
          );
        }
      }
      return;
    }

    for (var si = 0; si < series.length; si++) {
      final color = iChartPalette[si % iChartPalette.length];
      final raw = series[si].data;
      final upper = stackedArea
          ? [for (var i = 0; i < raw.length; i++) raw[i] + below(i, si)]
          : raw;

      final line = Path();
      for (var i = 0; i < upper.length; i++) {
        final p = Offset(x(i), y(upper[i]));
        if (i == 0) {
          line.moveTo(p.dx, p.dy);
        } else {
          // 阶梯：值保持到下一个点再跳变，而不是斜着连过去
          if (curve == 'step') line.lineTo(p.dx, y(upper[i - 1]));
          line.lineTo(p.dx, p.dy);
        }
      }

      if (type == IChartType.area) {
        // 每层画成上下沿之间的带状区域，颜色才等于系列色而不是叠出来的混合色
        final area = Path.from(line);
        if (stackedArea) {
          for (var i = upper.length - 1; i >= 0; i--) {
            area.lineTo(x(i), y(below(i, si)));
          }
        } else {
          area.lineTo(x(upper.length - 1), y(math.max(lo, 0)));
          area.lineTo(x(0), y(math.max(lo, 0)));
        }
        area.close();
        // 用 fromRGBO 兑半透明：withOpacity 在新版被标记废弃，withValues 又要 3.27 以上，
        // 这个写法在 pubspec 声明支持的全部版本上都成立
        canvas.drawPath(
          area,
          Paint()..color = Color.fromRGBO(color.red, color.green, color.blue, 0.22),
        );
      }

      canvas.drawPath(
        line,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round,
      );
    }

    /*
     * 目标线：品牌色虚线，与阈值的状态色分开。
     * 阈值说的是「越过就有问题」，目标说的是「要达到」——
     * 用危险色画目标，会让一个还没达成的目标看起来像一次故障。
     */
    final goal = target;
    if (goal != null) {
      final paint = Paint()
        ..color = colors.brand
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke;
      const dash = 6.0;
      const gap = 4.0;
      var cursor = padLeft;
      final lineY = y(goal);
      while (cursor < size.width - padRight) {
        final end = math.min(cursor + dash, size.width - padRight);
        canvas.drawLine(Offset(cursor, lineY), Offset(end, lineY), paint);
        cursor = end + gap;
      }
    }
  }

  /*
   * 横条：轴系走 logic/axis.dart，与 Web 端同一份实现——
   * 横纵共用同一套刻度，同一份数据横过来刻度密度不会变。
   */
  void _paintHorizontal(Canvas canvas, Size size, double left, double plotW, double plotH) {
    final domain = domainOf(
      series.map((s) => s.data).toList(),
      fromZero: true,
      stacked: stacked,
    );
    final axis = valueAxis(domain.min, domain.max, plotW,
        orientation: IAxisOrientation.horizontal, format: formatTick);
    final bands = categoryBands(labels.length, plotH);
    final totals = [
      for (var i = 0; i < labels.length; i += 1)
        series.fold<double>(0, (sum, s) => sum + (i < s.data.length ? s.data[i] : 0))
    ];
    final order = rankOrder(totals, rank);
    final thickness = stacked
        ? (bands.isEmpty ? 0.0 : bands.first.size) * 0.5
        : ((bands.isEmpty ? 0.0 : bands.first.size) * 0.62) / series.length;

    double hx(double value) =>
        left + ((value - axis.min) / ((axis.max - axis.min) == 0 ? 1 : axis.max - axis.min)) * plotW;

    final grid = Paint()
      ..color = colors.hairline
      ..strokeWidth = 1;
    for (final tick in axis.ticks) {
      canvas.drawLine(
        Offset(left + tick.offset, padTop),
        Offset(left + tick.offset, padTop + plotH),
        grid,
      );
      _text(canvas, tick.label, Offset(left + tick.offset, size.height - padBottom + 6),
          colors.textTertiary, align: TextAlign.center);
    }
    canvas.drawLine(
      Offset(left + axis.baseline, padTop),
      Offset(left + axis.baseline, padTop + plotH),
      Paint()
        ..color = colors.border
        ..strokeWidth = 1,
    );

    // 类目名正着写在左边，长名字也读得下去——这正是横条存在的理由
    for (var row = 0; row < order.length; row += 1) {
      _text(canvas, labels[order[row]], Offset(left - 8, padTop + bands[row].center - 7),
          colors.textTertiary, align: TextAlign.right);
    }

    double below(int i, int si) => series
        .take(si)
        .fold<double>(0, (sum, s) => sum + (i < s.data.length ? s.data[i] : 0));

    for (var si = 0; si < series.length; si += 1) {
      final paint = Paint()..color = iChartPalette[si % iChartPalette.length];
      for (var row = 0; row < order.length; row += 1) {
        final dataIndex = order[row];
        final band = bands[row];
        final value = dataIndex < series[si].data.length ? series[si].data[dataIndex] : 0.0;
        final base = stacked ? below(dataIndex, si) : 0.0;
        final offsetInBand = stacked
            ? (band.size - thickness) / 2
            : (band.size - thickness * series.length) / 2 + si * thickness;
        final rect = barRect(
          band: band,
          thickness: thickness,
          offsetInBand: offsetInBand,
          from: hx(base),
          to: hx(base + value),
          orientation: IAxisOrientation.horizontal,
        );
        // 只有最外面一段收圆角：中间段也圆会看起来像一颗颗独立的胶囊
        final isOuter = !stacked || si == series.length - 1;
        canvas.drawRRect(
          RRect.fromRectAndCorners(
            Rect.fromLTWH(rect.x, rect.y + padTop, rect.width < 1 ? 1 : rect.width,
                rect.height < 1 ? 1 : rect.height),
            topRight: Radius.circular(isOuter ? 3 : 0),
            bottomRight: Radius.circular(isOuter ? 3 : 0),
          ),
          paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(_ChartPainter old) =>
      old.series != series ||
      old.type != type ||
      old.stacked != stacked ||
      old.curve != curve ||
      old.target != target ||
      old.orientation != orientation ||
      old.rank != rank ||
      old.colors != colors;
}
