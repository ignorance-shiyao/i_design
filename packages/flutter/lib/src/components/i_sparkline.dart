import 'package:flutter/material.dart';
import '../logic/chart.dart';
import '../theme/i_theme.dart';

enum ISparklineTone { brand, success, danger, neutral }

/// 嵌在指标卡或表格行里的走势图。
///
/// 不带坐标轴，也因此不从零起——形状才是它的信息。
class ISparkline extends StatelessWidget {
  const ISparkline({
    super.key,
    required this.data,
    this.width = 96,
    this.height = 28,
    this.tone = ISparklineTone.brand,
    this.area = true,
    this.showLast = true,
  });

  final List<double> data;
  final double width;
  final double height;
  final ISparklineTone tone;
  final bool area;
  final bool showLast;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final color = switch (tone) {
      ISparklineTone.brand => c.brand,
      ISparklineTone.success => c.success,
      ISparklineTone.danger => c.danger,
      ISparklineTone.neutral => c.textTertiary,
    };

    return SizedBox(
      width: width,
      height: height,
      child: CustomPaint(
        painter: _SparkPainter(data: data, color: color, area: area, showLast: showLast, surface: c.bg),
      ),
    );
  }
}

class _SparkPainter extends CustomPainter {
  const _SparkPainter({
    required this.data,
    required this.color,
    required this.area,
    required this.showLast,
    required this.surface,
  });

  final List<double> data;
  final Color color;
  final bool area;
  final bool showLast;
  final Color surface;

  @override
  void paint(Canvas canvas, Size size) {
    if (data.length < 2) return;
    final domain = domainOf([data], fromZero: false);

    final path = Path();
    for (var i = 0; i < data.length; i++) {
      final p = Offset(
        scaleX(i, data.length, size.width),
        scaleY(data[i], domain.min, domain.max, size.height),
      );
      i == 0 ? path.moveTo(p.dx, p.dy) : path.lineTo(p.dx, p.dy);
    }

    if (area) {
      final filled = Path.from(path)
        ..lineTo(size.width, size.height)
        ..lineTo(0, size.height)
        ..close();
      canvas.drawPath(
        filled,
        Paint()..color = Color.fromRGBO(color.red, color.green, color.blue, 0.14),
      );
    }

    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );

    if (showLast) {
      final last = Offset(
        scaleX(data.length - 1, data.length, size.width),
        scaleY(data.last, domain.min, domain.max, size.height),
      );
      canvas.drawCircle(last, 2.5, Paint()..color = color);
      canvas.drawCircle(
        last,
        2.5,
        Paint()
          ..color = surface
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5,
      );
    }
  }

  @override
  bool shouldRepaint(_SparkPainter old) => old.data != data || old.color != color;
}
