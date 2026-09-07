import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 文字提示。
///
/// 移动端没有 hover，所以底层用 Flutter 的 Tooltip：它在触屏上以长按触发，
/// 在桌面与 Web 上以悬停触发，一份用法覆盖两种输入方式。
class ITooltip extends StatelessWidget {
  const ITooltip({
    super.key,
    required this.child,
    required this.message,
    this.placement = AxisDirection.up,
    this.waitDuration = const Duration(milliseconds: 200),
  });

  final Widget child;
  final String message;

  /// 只区分上下：左右浮层在窄屏上几乎必然被裁切
  final AxisDirection placement;
  final Duration waitDuration;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Tooltip(
      message: message,
      preferBelow: placement == AxisDirection.down,
      waitDuration: waitDuration,
      padding: const EdgeInsets.symmetric(
        horizontal: IDesignTokensLight.spacing3,
        vertical: IDesignTokensLight.spacing2,
      ),
      decoration: BoxDecoration(
        // 用反色背景令牌：浅色模式深底、深色模式浅底，两边都与页面拉开对比
        color: isDark ? IDesignTokensDark.colorBgInverse : IDesignTokensLight.colorBgInverse,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      textStyle: TextStyle(
        color: isDark ? IDesignTokensDark.colorTextInverse : IDesignTokensLight.colorTextInverse,
        fontSize: IDesignTokensLight.fontSizeSm,
      ),
      child: child,
    );
  }
}
