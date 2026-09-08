import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../logic/chart.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_chart.dart';

@immutable
class IPieItem {
  const IPieItem({required this.name, required this.value});

  final String name;
  final double value;
}

/// 占比图。
///
/// 默认环形而不是实心饼：读者比较的是弧长，比面积更容易读准。
/// 数值写在图例上而不是扇区里——扇区一小就会互相压字。
class IChartPie extends StatelessWidget {
  const IChartPie({
    super.key,
    required this.items,
    this.donut = true,
    this.size = 180,
    this.title = '',
    this.centerLabel = '',
    this.unit = '',
  });

  final List<IPieItem> items;
  final bool donut;
  final double size;
  final String title;
  final String centerLabel;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final total = items.fold<double>(0, (sum, i) => sum + math.max(0, i.value));

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
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: size,
              height: size,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CustomPaint(
                    size: Size.square(size),
                    painter: _PiePainter(
                      values: items.map((i) => i.value).toList(),
                      donut: donut,
                      surface: c.bg,
                    ),
                  ),
                  if (donut)
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${formatTick(total)}$unit',
                          style: TextStyle(
                            color: c.text,
                            fontSize: IDesignTokensLight.fontSizeXl,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (centerLabel.isNotEmpty)
                          Text(
                            centerLabel,
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
            const SizedBox(width: IDesignTokensLight.spacing5),
            Expanded(
              child: Column(
                children: [
                  for (var i = 0; i < items.length; i++)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
                      child: Row(
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
                          Expanded(
                            child: Text(
                              items[i].name,
                              style: TextStyle(
                                color: c.textSecondary,
                                fontSize: IDesignTokensLight.fontSizeSm,
                              ),
                            ),
                          ),
                          Text(
                            '${formatTick(items[i].value)}$unit',
                            style: TextStyle(
                              color: c.text,
                              fontSize: IDesignTokensLight.fontSizeSm,
                            ),
                          ),
                          const SizedBox(width: IDesignTokensLight.spacing2),
                          Text(
                            total <= 0
                                ? '—'
                                : '${(items[i].value / total * 100).toStringAsFixed(1)}%',
                            style: TextStyle(
                              color: c.textTertiary,
                              fontSize: IDesignTokensLight.fontSizeXs,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _PiePainter extends CustomPainter {
  const _PiePainter({required this.values, required this.donut, required this.surface});

  final List<double> values;
  final bool donut;

  /// 扇区之间的缝隙用底色描边画出来，色觉障碍下它比颜色更可靠
  final Color surface;

  @override
  void paint(Canvas canvas, Size size) {
    final total = values.fold<double>(0, (sum, v) => sum + math.max(0, v));
    if (total <= 0) return;

    final radius = size.width / 2;
    final inner = donut ? radius * 0.62 : 0.0;
    final center = Offset(radius, radius);
    var angle = -math.pi / 2; // 从 12 点方向开始，与阅读习惯一致

    for (var i = 0; i < values.length; i++) {
      final sweep = math.max(0, values[i]) / total * math.pi * 2;
      final path = Path();
      if (donut) {
        path.addArc(Rect.fromCircle(center: center, radius: radius), angle, sweep);
        path.arcTo(Rect.fromCircle(center: center, radius: inner), angle + sweep, -sweep, false);
        path.close();
      } else {
        path.moveTo(center.dx, center.dy);
        path.arcTo(Rect.fromCircle(center: center, radius: radius), angle, sweep, false);
        path.close();
      }
      canvas.drawPath(path, Paint()..color = iChartPalette[i % iChartPalette.length]);
      canvas.drawPath(
        path,
        Paint()
          ..color = surface
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2,
      );
      angle += sweep;
    }
  }

  @override
  bool shouldRepaint(_PiePainter old) => old.values != values || old.donut != donut;
}
