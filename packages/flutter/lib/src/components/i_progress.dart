import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum IProgressStatus { normal, success, warning, danger }

/// 线形与环形进度。
///
/// 100% 不自动变成成功色：进度走完不等于任务成功，上传完成还可能校验失败，
/// 状态由调用方显式给出——与 Web 端同一条规则。
class IProgress extends StatelessWidget {
  const IProgress({
    super.key,
    this.percent = 0,
    this.status = IProgressStatus.normal,
    this.size = ISize.md,
    this.indeterminate = false,
    this.showText = true,
    this.text,
  })  : circle = false,
        width = 0;

  /// 环形。[width] 是直径。
  const IProgress.circle({
    super.key,
    this.percent = 0,
    this.status = IProgressStatus.normal,
    this.size = ISize.md,
    this.showText = true,
    this.text,
    this.width = 96,
  })  : circle = true,
        indeterminate = false;

  /// 0-100
  final double percent;
  final IProgressStatus status;
  final ISize size;

  /// 不知道还剩多少：显示来回滑动的一小段（仅线形）
  final bool indeterminate;
  final bool showText;

  /// 自定义文字，留空则显示百分比
  final String? text;
  final bool circle;
  final double width;

  double get _clamped => percent.clamp(0, 100).toDouble();
  String get _label => text ?? '${_clamped.round()}%';

  double get _stroke => switch (size) {
        ISize.sm => 4,
        ISize.md => 6,
        ISize.lg => 10,
      };

  Color _tint(IColors c) => switch (status) {
        IProgressStatus.normal => c.brand,
        IProgressStatus.success => c.success,
        IProgressStatus.warning => c.warning,
        IProgressStatus.danger => c.danger,
      };

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    if (circle) {
      return SizedBox(
        width: width,
        height: width,
        child: Stack(
          alignment: Alignment.center,
          children: [
            CustomPaint(
              size: Size.square(width),
              painter: _RingPainter(
                percent: _clamped,
                stroke: _stroke,
                track: c.bgMuted,
                bar: _tint(c),
              ),
            ),
            if (showText)
              Text(
                _label,
                style: TextStyle(
                  color: c.text,
                  fontSize: IDesignTokensLight.fontSizeLg,
                  // 等宽数位：进度数字会跳动，比例数位会让整块内容左右抖
                  fontFeatures: const [ui.FontFeature.tabularFigures()],
                ),
              ),
          ],
        ),
      );
    }

    return Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
            child: LinearProgressIndicator(
              // 传 null 即为不确定进度，动画由框架提供
              value: indeterminate ? null : _clamped / 100,
              minHeight: _stroke + 2,
              backgroundColor: c.bgMuted,
              valueColor: AlwaysStoppedAnimation(_tint(c)),
            ),
          ),
        ),
        if (showText && !indeterminate) ...[
          const SizedBox(width: IDesignTokensLight.spacing3),
          SizedBox(
            width: 48,
            child: Text(
              _label,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: c.textSecondary,
                fontSize: IDesignTokensLight.fontSizeSm,
                // 等宽数位：进度数字会跳动，比例数位会让整块内容左右抖
                  fontFeatures: const [ui.FontFeature.tabularFigures()],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.percent,
    required this.stroke,
    required this.track,
    required this.bar,
  });

  final double percent;
  final double stroke;
  final Color track;
  final Color bar;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - stroke) / 2;

    final trackPaint = Paint()
      ..color = track
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke;
    canvas.drawCircle(center, radius, trackPaint);

    if (percent <= 0) return;
    final barPaint = Paint()
      ..color = bar
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    // 从 12 点方向顺时针画，与 Web 端的 rotate(-90deg) 一致
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * (percent / 100),
      false,
      barPaint,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.percent != percent || old.stroke != stroke || old.bar != bar || old.track != track;
}
