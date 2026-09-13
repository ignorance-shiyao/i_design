import 'package:flutter/material.dart';
import '../logic/insight.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 洞察卡：一句结论配一条趋势线，左右翻页看下一条。
///
/// 结论在上、图在下：主角是那句话，图是它的依据。反过来排，读者会先自己解读
/// 曲线，等读到结论时已经有了一个判断——两者不一致时他信自己那个，这张卡就白做了。
///
/// 趋势线可以擦洗：一句「周三回升」不给具体数字，读者无从判断这个回升是 2%
/// 还是 20%。按住横向划过曲线，读数跟着走。
class IInsightCards extends StatefulWidget {
  const IInsightCards({
    super.key,
    required this.items,
    this.index = 0,
    this.onIndexChanged,
  });

  final List<InsightItemData> items;

  /// 当前是第几条
  final int index;
  final ValueChanged<int>? onIndexChanged;

  @override
  State<IInsightCards> createState() => _IInsightCardsState();
}

/// 图的高度。与 Web 端的 84px 一致，同一张卡在两端占的位置才一样
const double _kPlotHeight = 84;

class _IInsightCardsState extends State<IInsightCards> {
  /// 擦洗到第几个点。null 表示没在擦——此时读数显示最后一个点
  int? _scrubbed;

  double _plotWidth = 0;

  InsightItemData? get _current =>
      widget.index >= 0 && widget.index < widget.items.length ? widget.items[widget.index] : null;

  int get _activeIndex {
    final count = _current?.series.length ?? 0;
    if (count == 0) return 0;
    return _scrubbed ?? count - 1;
  }

  void _go(int delta) {
    setState(() => _scrubbed = null);
    widget.onIndexChanged?.call(insightPage(widget.items.length, widget.index, delta));
  }

  void _scrub(double x) {
    final count = _current?.series.length ?? 0;
    // 减掉留边：曲线是缩进去画的，不减的话手指在左边缘时算出来的是负数
    final plot = insightPlot(_plotWidth);
    setState(() => _scrubbed = scrubIndex(x - plot.inset, plot.inner, count));
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final item = _current;
    if (item == null) return const SizedBox.shrink();

    final trend = insightTrend(item.series);
    final readout = scrubReadout(item, _activeIndex);

    return Container(
      padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
      decoration: BoxDecoration(
        color: c.bgElevated,
        // 四边等宽的发丝线：涨还是跌由图标与文字说，不靠加粗某一条边
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.title,
                  style: TextStyle(
                    color: c.text,
                    fontSize: IDesignTokensLight.fontSizeMd,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              _trendPill(c, trend),
            ],
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
          Text(
            item.summary,
            style: TextStyle(
              color: c.textSecondary,
              fontSize: IDesignTokensLight.fontSizeSm,
              height: 1.7,
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
          LayoutBuilder(
            builder: (context, constraints) {
              _plotWidth = constraints.maxWidth;
              return GestureDetector(
                behavior: HitTestBehavior.opaque,
                onHorizontalDragStart: (d) => _scrub(d.localPosition.dx),
                onHorizontalDragUpdate: (d) => _scrub(d.localPosition.dx),
                onTapDown: (d) => _scrub(d.localPosition.dx),
                child: CustomPaint(
                  size: Size(constraints.maxWidth, _kPlotHeight),
                  painter: _SparkPainter(
                    series: item.series,
                    activeIndex: _activeIndex,
                    line: c.brand,
                    // 面积是氛围底而不是元素色：它描述的是「线以下这片」的质感
                    area: c.brand.withValues(alpha: 0.14),
                    cursor: c.borderStrong,
                    dotRing: c.bgElevated,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: IDesignTokensLight.spacing2),
          // 读数写在图外面：画进画布的字不会跟着系统字号走
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                readout.label,
                style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
              ),
              const SizedBox(width: IDesignTokensLight.spacing2),
              Text(
                readout.value,
                style: TextStyle(
                  color: c.text,
                  fontSize: IDesignTokensLight.fontSizeSm,
                  fontWeight: FontWeight.w600,
                  // 擦洗时数字逐个变，等宽数字才不会让整行左右抖
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              _nav(c, 'chevron-left', '上一条洞察', widget.index > 0, () => _go(-1)),
              const SizedBox(width: IDesignTokensLight.spacing2),
              // 位置用文字而不是一排点：点只说得清「有几条」，说不清「现在是第几条」
              Text(
                '${widget.index + 1} / ${widget.items.length}',
                style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
              ),
              const SizedBox(width: IDesignTokensLight.spacing2),
              _nav(
                c,
                'chevron-right',
                '下一条洞察',
                widget.index < widget.items.length - 1,
                () => _go(1),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// 涨跌是图标 + 淡底色块 + 文字三条线索，颜色只是其中最弱的一条
  Widget _trendPill(IColors c, InsightTrend trend) {
    final (fg, bg) = switch (trend.direction) {
      InsightDirection.up => (c.success, c.successSubtle),
      InsightDirection.down => (c.danger, c.dangerSubtle),
      InsightDirection.flat => (c.textSecondary, c.bgSubtle),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IIcon(name: trendIcon(trend), size: 13, color: fg),
          const SizedBox(width: IDesignTokensLight.spacing1),
          Text(
            trendLabel(trend),
            style: TextStyle(color: fg, fontSize: IDesignTokensLight.fontSizeXs),
          ),
        ],
      ),
    );
  }

  /// 到头时变淡且不可点，不隐藏——按钮消失会让下面的内容跳一下
  Widget _nav(IColors c, String icon, String label, bool enabled, VoidCallback onTap) {
    return Semantics(
      label: label,
      button: true,
      enabled: enabled,
      child: Opacity(
        opacity: enabled ? 1 : 0.4,
        child: GestureDetector(
          onTap: enabled ? onTap : null,
          child: Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: c.bgElevated,
              border: Border.all(color: c.hairline),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
            ),
            child: Center(child: IIcon(name: icon, size: 15, color: c.textSecondary)),
          ),
        ),
      ),
    );
  }
}

class _SparkPainter extends CustomPainter {
  const _SparkPainter({
    required this.series,
    required this.activeIndex,
    required this.line,
    required this.area,
    required this.cursor,
    required this.dotRing,
  });

  final List<double> series;
  final int activeIndex;
  final Color line;
  final Color area;
  final Color cursor;
  final Color dotRing;

  @override
  void paint(Canvas canvas, Size size) {
    if (series.isEmpty) return;
    // 曲线往里缩一圈，首尾的标记圆才是整圆而不是被边裁掉一半
    final plot = insightPlot(size.width);
    // 域取实际最小最大而不是从 0 起：从 0 起会把一条明显的波动压成直线
    var min = series.first, max = series.first;
    for (final v in series) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    final span = max - min == 0 ? 1.0 : max - min;
    Offset at(int i) => Offset(
          plot.inset + (series.length == 1 ? 0 : (i / (series.length - 1)) * plot.inner),
          size.height - ((series[i] - min) / span) * size.height,
        );

    final path = Path()..moveTo(at(0).dx, at(0).dy);
    for (var i = 1; i < series.length; i++) {
      path.lineTo(at(i).dx, at(i).dy);
    }

    final filled = Path.from(path)
      ..lineTo(plot.inset + plot.inner, size.height)
      ..lineTo(plot.inset, size.height)
      ..close();
    canvas.drawPath(filled, Paint()..color = area);
    canvas.drawPath(
      path,
      Paint()
        ..color = line
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );

    final marker = at(activeIndex.clamp(0, series.length - 1));
    _dashedLine(canvas, Offset(marker.dx, 0), Offset(marker.dx, size.height));
    canvas.drawCircle(marker, insightDotR, Paint()..color = line);
    canvas.drawCircle(
      marker,
      insightDotR,
      Paint()
        ..color = dotRing
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
  }

  /// Flutter 没有 strokeDasharray，虚线只能自己按段画
  void _dashedLine(Canvas canvas, Offset from, Offset to) {
    final paint = Paint()
      ..color = cursor
      ..strokeWidth = 1;
    const dash = 3.0, gap = 3.0;
    final total = (to - from).distance;
    final step = (to - from) / total;
    var travelled = 0.0;
    while (travelled < total) {
      final end = travelled + dash < total ? travelled + dash : total;
      canvas.drawLine(from + step * travelled, from + step * end, paint);
      travelled = end + gap;
    }
  }

  @override
  bool shouldRepaint(_SparkPainter old) =>
      old.series != series || old.activeIndex != activeIndex || old.line != line;
}
