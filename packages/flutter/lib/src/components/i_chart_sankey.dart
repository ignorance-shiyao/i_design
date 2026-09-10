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
