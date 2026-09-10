import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/chart.dart';

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
