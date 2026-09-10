import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../theme/i_theme.dart';

/// 水印。
///
/// 拦不住有心人，但能让随手截图的人留下痕迹。价值全在细节：
/// 太密挡内容，太疏截一小块就没有——间距与角度必须与其余端一致。
///
/// 这一端用 CustomPainter 铺，而不是共用 Web 的 SVG 数据 URI：
/// Flutter 没有 background-image 平铺，硬把 SVG 塞进来要多背一个解析库。
/// 排布参数（间距、角度、透明度）仍与公共层同一套取值。
class IWatermark extends StatelessWidget {
  const IWatermark({
    super.key,
    required this.child,
    required this.text,
    this.fontSize = 14,
    this.rotate = -22,
    this.gapX = 100,
    this.gapY = 100,
    this.opacity = 0.12,
    this.color,
  });

  final Widget child;

  /// 一行或多行文字。多行时逐行往下排
  final List<String> text;
  final double fontSize;

  /// 逆时针角度
  final double rotate;
  final double gapX;
  final double gapY;
  final double opacity;

  /// 不传时跟随文字色，深浅主题都能看见
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return Stack(
      children: [
        child,
        // 水印层盖在内容上但不吃事件——它是标记，不是遮罩。
        // ExcludeSemantics：读屏把满屏重复的用户名念一遍，内容就没法听了
        Positioned.fill(
          child: IgnorePointer(
            child: ExcludeSemantics(
              child: CustomPaint(
                painter: _WatermarkPainter(
                  lines: text,
                  fontSize: fontSize,
                  rotate: rotate,
                  gapX: gapX,
                  gapY: gapY,
                  color: (color ?? c.text).withValues(alpha: opacity),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _WatermarkPainter extends CustomPainter {
  _WatermarkPainter({
    required this.lines,
    required this.fontSize,
    required this.rotate,
    required this.gapX,
    required this.gapY,
    required this.color,
  });

  final List<String> lines;
  final double fontSize;
  final double rotate;
  final double gapX;
  final double gapY;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (lines.isEmpty) return;
    final painters = lines
        .map((line) => TextPainter(
              text: TextSpan(text: line, style: TextStyle(color: color, fontSize: fontSize)),
              textDirection: TextDirection.ltr,
            )..layout())
        .toList();

    final lineHeight = (fontSize * 1.5).roundToDouble();
    final textWidth = painters.map((p) => p.width).reduce(math.max);
    final textHeight = painters.length * lineHeight;

    // 瓦片尺寸要把旋转后的外接框算进去：只按文字宽高铺，
    // 倾斜之后四个角会被相邻的块裁掉，出来是一片断头断尾的字
    final radians = (rotate.abs() * math.pi) / 180;
    final tileWidth = textWidth * math.cos(radians) + textHeight * math.sin(radians) + gapX;
    final tileHeight = textWidth * math.sin(radians) + textHeight * math.cos(radians) + gapY;

    for (var y = 0.0; y < size.height + tileHeight; y += tileHeight) {
      for (var x = 0.0; x < size.width + tileWidth; x += tileWidth) {
        canvas.save();
        canvas.translate(x + tileWidth / 2, y + tileHeight / 2);
        canvas.rotate(rotate * math.pi / 180);
        for (var i = 0; i < painters.length; i++) {
          final p = painters[i];
          p.paint(
            canvas,
            Offset(-p.width / 2, (i - (painters.length - 1) / 2) * lineHeight - p.height / 2),
          );
        }
        canvas.restore();
      }
    }
  }

  @override
  bool shouldRepaint(_WatermarkPainter old) =>
      old.lines != lines || old.color != color || old.rotate != rotate;
}
