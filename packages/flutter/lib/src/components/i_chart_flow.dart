import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/chart.dart';

/// 桑基图：一份量在各个环节之间怎么分流。
///
/// 节点是「身份」，用分类色按层内顺序分配，超过 8 个不再循环——
/// 第 9 个颜色会破坏这组色的色觉安全保证。
class IChartSankey extends StatelessWidget {
  const IChartSankey({
    super.key,
    required this.links,
    this.labels = const <String, String>{},
    this.title = '',
    this.height = 300,
    this.unit = '',
  });

  final List<ISankeyLink> links;

  /// key → 显示名；不传就直接用 key
  final Map<String, String> labels;
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
            style: TextStyle(fontSize: IDesignTokensLight.fontSizeMd, color: c.text),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
        SizedBox(
          height: height,
          child: CustomPaint(
            size: Size.infinite,
            painter: _SankeyPainter(
              links: links,
              labels: labels,
              unit: unit,
              palette: _categorical,
              neutral: c.textTertiary,
              label: c.textSecondary,
            ),
          ),
        ),
      ],
    );
  }
}

const _categorical = <Color>[
  IDesignTokensLight.chart1,
  IDesignTokensLight.chart2,
  IDesignTokensLight.chart3,
  IDesignTokensLight.chart4,
  IDesignTokensLight.chart5,
  IDesignTokensLight.chart6,
  IDesignTokensLight.chart7,
  IDesignTokensLight.chart8,
];

class _SankeyPainter extends CustomPainter {
  _SankeyPainter({
    required this.links,
    required this.labels,
    required this.unit,
    required this.palette,
    required this.neutral,
    required this.label,
  });

  final List<ISankeyLink> links;
  final Map<String, String> labels;
  final String unit;
  final List<Color> palette;
  final Color neutral;
  final Color label;

  @override
  void paint(Canvas canvas, Size size) {
    if (links.isEmpty) return;
    // 右侧留白给节点名，不留就会被画布边缘裁掉
    const pad = EdgeInsets.fromLTRB(8, 8, 96, 8);
    final layout = sankeyLayout(
      links,
      size.width - pad.left - pad.right,
      size.height - pad.top - pad.bottom,
      labels: labels,
    );

    Color colorOf(String key) {
      final index = layout.nodes.indexWhere((n) => n.key == key);
      return index >= 0 && index < palette.length ? palette[index] : neutral;
    }

    canvas.save();
    canvas.translate(pad.left, pad.top);

    // 缎带先画、节点后画：节点压在上面才能盖住收口处的接缝。
    // 半透明让交叉处仍能看出下面还有一条流。
    for (final ribbon in layout.ribbons) {
      final s = ribbon.source;
      final t = ribbon.target;
      final cx = ribbon.controlX;
      final path = Path()
        ..moveTo(s.x, s.top)
        ..cubicTo(cx, s.top, cx, t.top, t.x, t.top)
        ..lineTo(t.x, t.bottom)
        ..cubicTo(cx, t.bottom, cx, s.bottom, s.x, s.bottom)
        ..close();
      canvas.drawPath(path, Paint()..color = colorOf(ribbon.from).withValues(alpha: 0.42));
    }

    for (final node in layout.nodes) {
      canvas.drawRRect(
        RRect.fromLTRBR(node.x, node.y, node.x + node.width, node.y + node.height,
            const Radius.circular(2)),
        Paint()..color = colorOf(node.key),
      );
      // 桑基图没有坐标轴，名称与流量不标在节点旁就读不出量
      final tp = TextPainter(
        text: TextSpan(
          text: '${node.label} ${formatTick(node.value)}$unit',
          style: TextStyle(fontSize: 11, color: label),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas,
          Offset(node.x + node.width + 6, node.y + node.height / 2 - tp.height / 2));
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(_SankeyPainter old) => old.links != links;
}

/// 矩形树图：各部分在整体里各占多少。
///
/// 块表达的是「多少」而不是「谁」，因此用单色顺序色阶：
/// 分类色会让人以为颜色另有含义，而面积已经在表达量级了。
class IChartTreemap extends StatelessWidget {
  const IChartTreemap({
    super.key,
    required this.items,
    this.title = '',
    this.height = 300,
    this.unit = '',
  });

  final List<ITreemapItem> items;
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
            style: TextStyle(fontSize: IDesignTokensLight.fontSizeMd, color: c.text),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
        SizedBox(
          height: height,
          child: CustomPaint(
            size: Size.infinite,
            painter: _TreemapPainter(items: items, unit: unit),
          ),
        ),
      ],
    );
  }
}

const _sequential = <Color>[
  IDesignTokensLight.chartSeq1,
  IDesignTokensLight.chartSeq2,
  IDesignTokensLight.chartSeq3,
  IDesignTokensLight.chartSeq4,
  IDesignTokensLight.chartSeq5,
];

/// 文字压在色块上，颜色跟随该档的对比色——深色档上的深字读不出来。
/// 取值来自令牌里生成的 chartSeqNInk，不是就地判断亮度。
const _sequentialInk = <Color>[
  IDesignTokensLight.chartSeq1Ink,
  IDesignTokensLight.chartSeq2Ink,
  IDesignTokensLight.chartSeq3Ink,
  IDesignTokensLight.chartSeq4Ink,
  IDesignTokensLight.chartSeq5Ink,
];

class _TreemapPainter extends CustomPainter {
  _TreemapPainter({required this.items, required this.unit});

  final List<ITreemapItem> items;
  final String unit;

  @override
  void paint(Canvas canvas, Size size) {
    if (items.isEmpty) return;
    final tiles = treemapLayout(items, size.width, size.height);
    var total = 0.0;
    var max = 1.0;
    for (final i in items) {
      total += i.value;
      if (i.value > max) max = i.value;
    }
    if (total == 0) total = 1;

    for (final tile in tiles) {
      final ratio = (tile.percent * total) / max;
      final step = (ratio * 4).round().clamp(0, 4);
      canvas.drawRRect(
        RRect.fromLTRBR(tile.x + 1, tile.y + 1, tile.x + tile.width - 1,
            tile.y + tile.height - 1, const Radius.circular(2)),
        Paint()..color = _sequential[step],
      );

      // 小块放不下文字：塞进去会溢出到相邻块上，看起来像标错了
      if (tile.width > 56 && tile.height > 34) {
        final ink = _sequentialInk[step];
        _text(canvas, tile.label, Offset(tile.x + 10, tile.y + 18), ink, 13);
        _text(
          canvas,
          '${formatTick(tile.value)}$unit · ${(tile.percent * 100).round()}%',
          Offset(tile.x + 10, tile.y + 34),
          ink.withValues(alpha: 0.72),
          11,
        );
      }
    }
  }

  void _text(Canvas canvas, String s, Offset at, Color color, double size) {
    final tp = TextPainter(
      text: TextSpan(text: s, style: TextStyle(fontSize: size, color: color)),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset(at.dx, at.dy - tp.height / 2));
  }

  @override
  bool shouldRepaint(_TreemapPainter old) => old.items != items;
}
