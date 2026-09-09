import 'package:flutter/material.dart';
import '../logic/upload.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 上传列表。
///
/// Flutter 端不内置文件选择：选文件要依赖 image_picker / file_picker 之类的插件，
/// 把它绑死在设计库里会强迫所有使用者接受同一个插件。这里只负责触发区与列表的呈现，
/// 选择与真正的上传由 onPick 交回调用方，状态回流后本组件如实展示。
class IUpload extends StatelessWidget {
  const IUpload({
    super.key,
    required this.files,
    this.onPick,
    this.onRemove,
    this.onRetry,
    this.tip,
    this.enabled = true,
  });

  final List<IUploadFile> files;
  final VoidCallback? onPick;
  final ValueChanged<IUploadFile>? onRemove;
  final ValueChanged<IUploadFile>? onRetry;
  final String? tip;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    Widget row(IUploadFile file) {
      final failed = file.status == IUploadStatus.error;

      return Padding(
        padding: const EdgeInsets.only(top: IDesignTokensLight.spacing2),
        child: Row(
          children: [
            IIcon('file', size: 16, color: failed ? c.danger : c.textTertiary),
            const SizedBox(width: IDesignTokensLight.spacing2),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    file.name,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: failed ? c.danger : c.text,
                      fontSize: IDesignTokensLight.fontSizeSm,
                    ),
                  ),
                  if (file.status == IUploadStatus.uploading) ...[
                    const SizedBox(height: IDesignTokensLight.spacing1),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
                      child: LinearProgressIndicator(
                        value: file.percent / 100,
                        minHeight: 3,
                        backgroundColor: c.bgMuted,
                        valueColor: AlwaysStoppedAnimation(c.brand),
                      ),
                    ),
                  ] else
                    Text(
                      // 失败时把原因顶到显眼位置，文件大小让位
                      failed ? (file.error ?? '上传失败') : formatSize(file.size),
                      style: TextStyle(
                        color: failed ? c.danger : c.textTertiary,
                        fontSize: IDesignTokensLight.fontSizeXs,
                      ),
                    ),
                ],
              ),
            ),
            if (failed && onRetry != null)
              IconButton(
                onPressed: () => onRetry!(file),
                icon: IIcon('refresh', size: 14, color: c.textTertiary, semanticLabel: '重试'),
              ),
            if (onRemove != null)
              IconButton(
                onPressed: () => onRemove!(file),
                icon: IIcon('trash', size: 14, color: c.textTertiary, semanticLabel: '移除'),
              ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: enabled ? onPick : null,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
          child: DottedBorderBox(
            color: c.borderStrong,
            radius: IDesignTokensLight.radiusLg,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing6),
              child: Column(
                children: [
                  IIcon('plus', size: 20, color: c.textTertiary),
                  const SizedBox(height: IDesignTokensLight.spacing2),
                  Text(
                    '点击选择文件',
                    style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeMd),
                  ),
                  if (tip != null) ...[
                    const SizedBox(height: IDesignTokensLight.spacing1),
                    Text(
                      tip!,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
        for (final file in files) row(file),
      ],
    );
  }
}

/// 虚线边框容器。
///
/// Flutter 的 Border 只画实线，而虚线框是「拖放/选择区」的通用语汇，
/// 换成实线会让它看起来像一个普通卡片，因此这里自绘一层。
class DottedBorderBox extends StatelessWidget {
  const DottedBorderBox({
    super.key,
    required this.child,
    required this.color,
    this.radius = 8,
    this.dash = 4,
    this.gap = 3,
  });

  final Widget child;
  final Color color;
  final double radius;
  final double dash;
  final double gap;

  @override
  Widget build(BuildContext context) => CustomPaint(
        painter: _DashedRectPainter(color: color, radius: radius, dash: dash, gap: gap),
        child: child,
      );
}

class _DashedRectPainter extends CustomPainter {
  const _DashedRectPainter({
    required this.color,
    required this.radius,
    required this.dash,
    required this.gap,
  });

  final Color color;
  final double radius;
  final double dash;
  final double gap;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    final path = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Offset.zero & size,
        Radius.circular(radius),
      ));

    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final end = (distance + dash).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(distance, end), paint);
        distance = end + gap;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedRectPainter old) =>
      old.color != color || old.radius != radius || old.dash != dash || old.gap != gap;
}
