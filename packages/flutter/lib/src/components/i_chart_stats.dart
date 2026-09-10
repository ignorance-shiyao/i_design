import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/chart.dart';

/// 箱线图：分布的形状与离群点。
///
/// 用单一色相而不是分类色——每个箱子都是同一件事（一个分布），
/// 给它们各上一个颜色会让人以为颜色本身有含义。
class IChartBox extends StatelessWidget {
  const IChartBox({
    super.key,
    required this.groups,
    this.title = '',
    this.height = 260,
    this.unit = '',
  });

  /// 每组的标签与原始值
  final List<({String label, List<double> values})> groups;
  final String title;
  final double height;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final stats = groups.map((g) => boxStats(g.values)).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (title.isNotEmpty) ...[
          Text(
            title,
            style: TextStyle(
              fontSize: IDesignTokensLight.fontSizeMd,
              color: c.text,
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
        SizedBox(
          height: height,
          child: CustomPaint(
            size: Size.infinite,
            painter: _BoxPainter(
              groups: groups.map((g) => g.label).toList(),
              stats: stats,
              unit: unit,
              brand: c.brand,
              brandSubtle: c.brandSubtle,
              grid: c.hairline,
              tick: c.textTertiary,
              surface: c.bg,
            ),
          ),
        ),
      ],
    );
  }
}

class _BoxPainter extends CustomPainter {
  _BoxPainter({
    required this.groups,
    required this.stats,
    required this.unit,
    required this.brand,
    required this.brandSubtle,
    required this.grid,
    required this.tick,
    required this.surface,
  });

  final List<String> groups;
  final List<IBoxStats> stats;
  final String unit;
  final Color brand;
  final Color brandSubtle;
  final Color grid;
  final Color tick;
  final Color surface;

  @override
  void paint(Canvas canvas, Size size) {
    if (stats.isEmpty) return;
    const pad = EdgeInsets.fromLTRB(48, 16, 16, 28);
    final plotW = size.width - pad.left - pad.right;
    final plotH = size.height - pad.top - pad.bottom;

    // 值域含离群点：裁掉它们，图上就看不出「有异常值」这件事
    final all = <double>[];
    for (final s in stats) {
      if (s.min.isFinite) all.add(s.min);
      if (s.max.isFinite) all.add(s.max);
    }
    if (all.isEmpty) return;
    final ticks = niceTicks(all.reduce((a, b) => a < b ? a : b),
        all.reduce((a, b) => a > b ? a : b), 5);
    final lo = ticks.first;
    final hi = ticks.last;
    double y(double v) => scaleY(v, lo, hi, plotH) + pad.top;

    final gridPaint = Paint()
      ..color = grid
      ..strokeWidth = 1;
    for (final t in ticks) {
      canvas.drawLine(Offset(pad.left, y(t)), Offset(size.width - pad.right, y(t)), gridPaint);
      _text(canvas, '${formatTick(t)}$unit', Offset(pad.left - 6, y(t)),
          tick, TextAlign.right);
    }

    final band = plotW / stats.length;
    final boxW = (band * 0.5).clamp(8.0, 56.0);
    final stroke = Paint()
      ..color = brand
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    final fill = Paint()..color = brandSubtle;

    for (var i = 0; i < stats.length; i++) {
      final s = stats[i];
      final cx = pad.left + band * (i + 0.5);

      // 须：到 1.5×IQR 内的实测值，不是围栏位置
      canvas.drawLine(Offset(cx, y(s.upper)), Offset(cx, y(s.q3)), stroke);
      canvas.drawLine(Offset(cx, y(s.q1)), Offset(cx, y(s.lower)), stroke);
      canvas.drawLine(Offset(cx - boxW / 4, y(s.upper)), Offset(cx + boxW / 4, y(s.upper)), stroke);
      canvas.drawLine(Offset(cx - boxW / 4, y(s.lower)), Offset(cx + boxW / 4, y(s.lower)), stroke);

      final rect = RRect.fromLTRBR(
        cx - boxW / 2, y(s.q3), cx + boxW / 2, y(s.q1), const Radius.circular(2),
      );
      canvas.drawRRect(rect, fill);
      canvas.drawRRect(rect, stroke);

      // 中位线加粗：箱子里唯一需要一眼读出的位置
      canvas.drawLine(
        Offset(cx - boxW / 2, y(s.median)),
        Offset(cx + boxW / 2, y(s.median)),
        Paint()
          ..color = brand
          ..strokeWidth = 3
          ..strokeCap = StrokeCap.round,
      );

      // 离群点空心：它们本就是「例外」，实心会和箱体抢注意力
      for (final o in s.outliers) {
        canvas.drawCircle(Offset(cx, y(o)), 3, Paint()..color = surface);
        canvas.drawCircle(Offset(cx, y(o)), 3, stroke);
      }

      _text(canvas, groups[i], Offset(cx, size.height - 14), tick, TextAlign.center);
    }
  }

  void _text(Canvas canvas, String s, Offset at, Color color, TextAlign align) {
    final tp = TextPainter(
      text: TextSpan(text: s, style: TextStyle(fontSize: 11, color: color)),
      textDirection: TextDirection.ltr,
      textAlign: align,
    )..layout();
    final dx = switch (align) {
      TextAlign.right => at.dx - tp.width,
      TextAlign.center => at.dx - tp.width / 2,
      _ => at.dx,
    };
    tp.paint(canvas, Offset(dx, at.dy - tp.height / 2));
  }

  @override
  bool shouldRepaint(_BoxPainter old) => old.stats != stats;
}

/// 瀑布图：从期初到期末之间发生了什么。
///
/// 涨跌用双向色阶的两端而不是状态色的绿/红：收入增加是好事、成本增加是坏事，
/// 「增加」这个方向本身没有好坏，用状态色会把中性的方向读成评价。
class IChartWaterfall extends StatelessWidget {
  const IChartWaterfall({
    super.key,
    required this.items,
    this.title = '',
    this.height = 280,
    this.unit = '',
  });

  final List<IWaterfallItem> items;
  final String title;
  final double height;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (title.isNotEmpty) ...[
          Text(
            title,
            style: TextStyle(
              fontSize: IDesignTokensLight.fontSizeMd,
              color: c.text,
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
        SizedBox(
          height: height,
          child: CustomPaint(
            size: Size.infinite,
            painter: _WaterfallPainter(
              bars: waterfallBars(items),
              unit: unit,
              increase: c.chartDiv5,
              decrease: c.chartDiv1,
              total: c.textTertiary,
              grid: c.hairline,
              zero: c.borderStrong,
              connector: c.border,
              tick: c.textTertiary,
              value: c.textSecondary,
            ),
          ),
        ),
        const SizedBox(height: IDesignTokensLight.spacing2),
        // 颜色不是唯一线索：三种柱子同时给出文字
        Row(
          children: [
            _legend(c.chartDiv5, '增加'),
            const SizedBox(width: IDesignTokensLight.spacing4),
            _legend(c.chartDiv1, '减少'),
            const SizedBox(width: IDesignTokensLight.spacing4),
            _legend(c.textTertiary, '小计'),
          ],
        ),
      ],
    );
  }

  Widget _legend(Color color, String label) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: IDesignTokensLight.spacing1),
          Text(label, style: const TextStyle(fontSize: IDesignTokensLight.fontSizeXs)),
        ],
      );
}

class _WaterfallPainter extends CustomPainter {
  _WaterfallPainter({
    required this.bars,
    required this.unit,
    required this.increase,
    required this.decrease,
    required this.total,
    required this.grid,
    required this.zero,
    required this.connector,
    required this.tick,
    required this.value,
  });

  final List<IWaterfallBar> bars;
  final String unit;
  final Color increase;
  final Color decrease;
  final Color total;
  final Color grid;
  final Color zero;
  final Color connector;
  final Color tick;
  final Color value;

  @override
  void paint(Canvas canvas, Size size) {
    if (bars.isEmpty) return;
    const pad = EdgeInsets.fromLTRB(56, 24, 16, 44);
    final plotW = size.width - pad.left - pad.right;
    final plotH = size.height - pad.top - pad.bottom;

    final domain = waterfallDomain(bars);
    final ticks = niceTicks(domain[0], domain[1], 5);
    final lo = ticks.first;
    final hi = ticks.last;
    double y(double v) => scaleY(v, lo, hi, plotH) + pad.top;

    final gridPaint = Paint()
      ..color = grid
      ..strokeWidth = 1;
    for (final t in ticks) {
      canvas.drawLine(Offset(pad.left, y(t)), Offset(size.width - pad.right, y(t)), gridPaint);
      _text(canvas, '${formatTick(t)}$unit', Offset(pad.left - 6, y(t)), tick, TextAlign.right);
    }
    // 零线加重：回到零在瀑布图里是有意义的位置
    canvas.drawLine(Offset(pad.left, y(0)), Offset(size.width - pad.right, y(0)),
        Paint()..color = zero..strokeWidth = 1);

    final band = plotW / bars.length;
    final barW = (band * 0.62).clamp(6.0, 48.0);
    double left(int i) => pad.left + band * i + (band - barW) / 2;

    // 连接线：把上一根的终点引到下一根的起点，这是瀑布图区别于柱状图之处
    final dash = Paint()
      ..color = connector
      ..strokeWidth = 1;
    for (var i = 0; i < bars.length - 1; i++) {
      final yv = y(bars[i].end);
      var x = left(i) + barW;
      final endX = left(i + 1);
      while (x < endX) {
        canvas.drawLine(Offset(x, yv), Offset((x + 3).clamp(x, endX), yv), dash);
        x += 6;
      }
    }

    for (var i = 0; i < bars.length; i++) {
      final bar = bars[i];
      final color = switch (bar.kind) {
        IWaterfallKind.increase => increase,
        IWaterfallKind.decrease => decrease,
        IWaterfallKind.total => total,
      };
      final top = y(bar.start) < y(bar.end) ? y(bar.start) : y(bar.end);
      final h = (y(bar.end) - y(bar.start)).abs().clamp(2.0, double.infinity);
      canvas.drawRRect(
        RRect.fromLTRBR(left(i), top, left(i) + barW, top + h, const Radius.circular(2)),
        Paint()..color = color,
      );

      // 增减量直接标在柱子上：瀑布图的读者要的就是这个数
      final label = bar.kind == IWaterfallKind.total
          ? formatTick(bar.end)
          : '${bar.delta > 0 ? '+' : ''}${formatTick(bar.delta)}';
      _text(canvas, label, Offset(left(i) + barW / 2, top - 10), value, TextAlign.center);
      _text(canvas, bar.label, Offset(left(i) + barW / 2, size.height - 26), tick,
          TextAlign.center);
    }
  }

  void _text(Canvas canvas, String s, Offset at, Color color, TextAlign align) {
    final tp = TextPainter(
      text: TextSpan(text: s, style: TextStyle(fontSize: 11, color: color)),
      textDirection: TextDirection.ltr,
      textAlign: align,
    )..layout();
    final dx = switch (align) {
      TextAlign.right => at.dx - tp.width,
      TextAlign.center => at.dx - tp.width / 2,
      _ => at.dx,
    };
    tp.paint(canvas, Offset(dx, at.dy - tp.height / 2));
  }

  @override
  bool shouldRepaint(_WaterfallPainter old) => old.bars != bars;
}
