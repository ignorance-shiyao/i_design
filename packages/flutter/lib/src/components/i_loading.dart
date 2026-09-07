import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 加载指示器。
///
/// 区域加载优先于全屏加载——保留已渲染的内容，用户才知道自己还在原来的位置。
/// 包裹 [child] 时渲染为区域遮罩。
class ILoading extends StatelessWidget {
  const ILoading({
    super.key,
    this.child,
    this.loading = true,
    this.text,
    this.size = ISize.md,
  });

  final Widget? child;
  final bool loading;
  final String? text;
  final ISize size;

  double get _diameter => switch (size) {
        ISize.sm => 12.0,
        ISize.md => 18.0,
        ISize.lg => 26.0,
      };

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    final indicator = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: _diameter,
          height: _diameter,
          child: CircularProgressIndicator(strokeWidth: 2, color: c.brand),
        ),
        if (text != null) ...[
          const SizedBox(width: IDesignTokensLight.spacing2),
          Text(
            text!,
            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
          ),
        ],
      ],
    );

    if (child == null) return indicator;

    return Stack(
      children: [
        child!,
        if (loading)
          Positioned.fill(
            child: ColoredBox(
              color: c.bg.withValues(alpha: 0.72),
              child: Center(child: indicator),
            ),
          ),
      ],
    );
  }
}
