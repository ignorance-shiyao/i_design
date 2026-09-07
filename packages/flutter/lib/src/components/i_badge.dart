import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum IBadgeType { brand, success, warning, danger }

/// 徽标：标记数量或状态。
///
/// count 为 0 时默认隐藏，避免出现「0 条待办」这种噪音——与其他端同一条规则。
class IBadge extends StatelessWidget {
  const IBadge({
    super.key,
    this.child,
    this.count = 0,
    this.max = 99,
    this.dot = false,
    this.showZero = false,
    this.type = IBadgeType.danger,
  });

  final Widget? child;
  final int count;
  final int max;
  final bool dot;
  final bool showZero;
  final IBadgeType type;

  bool get _visible => dot || count > 0 || (count == 0 && showZero);
  String get _text => count > max ? '$max+' : '$count';

  Color _color(IColors c) => switch (type) {
        IBadgeType.brand => c.brand,
        IBadgeType.success => c.success,
        IBadgeType.warning => c.warning,
        IBadgeType.danger => c.danger,
      };

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    if (!_visible) return child ?? const SizedBox.shrink();

    final mark = Container(
      constraints: const BoxConstraints(minWidth: 18),
      height: dot ? 8 : 18,
      width: dot ? 8 : null,
      padding: dot ? null : const EdgeInsets.symmetric(horizontal: 5),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: _color(c),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
        // 叠在内容上时加一圈与背景同色的描边，把层次分开
        border: child != null ? Border.all(color: c.bg, width: 2) : null,
      ),
      child: dot
          ? null
          : Text(
              _text,
              style: const TextStyle(color: Colors.white, fontSize: IDesignTokensLight.fontSizeXs),
            ),
    );

    if (child == null) return mark;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        child!,
        Positioned(top: -6, right: -6, child: mark),
      ],
    );
  }
}
