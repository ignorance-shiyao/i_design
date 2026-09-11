import 'package:flutter/material.dart';
import '../logic/qrcode.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 二维码。
///
/// 矩阵来自 logic/qrcode，与 Web 各端同一份算法——同一段文本必须得到同一个版本
/// 与掩码，否则模块数对不上，设计稿里的尺寸与留白就得各端各调一遍。
///
/// 颜色只允许「深色码 + 浅色底」：主题色一旦是中等明度，码与底的对比度就掉到扫不出来，
/// 因此这里不跟随主题色，默认纯黑白。
class IQrcode extends StatelessWidget {
  const IQrcode({
    super.key,
    required this.value,
    this.size = 160,
    this.level = QrEcLevel.m,
    this.color = const Color(0xFF000000),
    this.background = const Color(0xFFFFFFFF),
    this.label,
  });

  final String value;

  /// 边长（逻辑像素），含静默区
  final double size;
  final QrEcLevel level;
  final Color color;
  final Color background;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final matrix = qrMatrix(value, level);

    if (matrix == null) {
      // 装不下就据实说明，不画一张残缺的码：残码扫出来是另一个地址
      return Container(
        padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
        decoration: BoxDecoration(
          color: c.dangerSubtle,
          border: Border.all(color: c.hairline),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Text(
          '内容过长，超出二维码容量',
          style: TextStyle(color: c.danger, fontSize: IDesignTokensLight.fontSizeXs),
        ),
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Semantics(
          label: label ?? '二维码：$value',
          image: true,
          child: CustomPaint(
            size: Size(size, size),
            painter: _QrPainter(matrix: matrix, color: color, background: background),
          ),
        ),
        if (label != null) ...[
          const SizedBox(height: IDesignTokensLight.spacing2),
          Text(
            label!,
            textAlign: TextAlign.center,
            style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeXs),
          ),
        ],
      ],
    );
  }
}

class _QrPainter extends CustomPainter {
  const _QrPainter({required this.matrix, required this.color, required this.background});

  final QrMatrix matrix;
  final Color color;
  final Color background;

  /// 静默区四个模块，规范给的下限。留白不够时相机会把旁边的文字当成模块
  static const int quiet = 4;

  @override
  void paint(Canvas canvas, Size size) {
    final side = matrix.size + quiet * 2;
    final unit = size.width / side;

    canvas.drawRect(Offset.zero & size, Paint()..color = background);

    final paint = Paint()..color = color;
    for (var r = 0; r < matrix.size; r++) {
      for (var c = 0; c < matrix.size; c++) {
        if (!matrix.modules[r][c]) continue;
        // 多画半像素盖住缝：逐块画时相邻块之间会露出底色，扫描器把那当成浅色模块
        canvas.drawRect(
          Rect.fromLTWH((c + quiet) * unit, (r + quiet) * unit, unit + 0.5, unit + 0.5),
          paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(_QrPainter old) =>
      old.matrix != matrix || old.color != color || old.background != background;
}
