import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 分割线。分隔优先用留白，留白不足以表达断点时才用它。
class IDivider extends StatelessWidget {
  const IDivider({super.key, this.label, this.vertical = false, this.dashed = false});

  final String? label;
  final bool vertical;

  /// Flutter 没有 CSS 的 dashed border，这里用点线自绘
  final bool dashed;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    if (vertical) {
      return Container(
        width: 1,
        height: 14,
        margin: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3),
        color: c.border,
      );
    }

    final line = Expanded(child: Container(height: 1, color: c.border));
    if (label == null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing6),
        child: Row(children: [line]),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing6),
      child: Row(
        children: [
          line,
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing4),
            child: Text(
              label!,
              style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm),
            ),
          ),
          line,
        ],
      ),
    );
  }
}
