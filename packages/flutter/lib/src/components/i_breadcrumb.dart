import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

@immutable
class IBreadcrumbItem {
  const IBreadcrumbItem({required this.label, this.onTap});

  final String label;

  /// 为空即视为当前页：不可点击、颜色转为主文字色
  final VoidCallback? onTap;
}

/// 面包屑。最后一项永远是当前页，不接受点击——即使调用方传了 onTap，
/// 因为「点击当前页」在导航上没有意义，容易误触。
class IBreadcrumb extends StatelessWidget {
  const IBreadcrumb({super.key, required this.items, this.separator = 'chevron-right'});

  final List<IBreadcrumbItem> items;
  final String separator;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final children = <Widget>[];

    for (var i = 0; i < items.length; i++) {
      final item = items[i];
      final isLast = i == items.length - 1;

      if (isLast || item.onTap == null) {
        children.add(Text(
          item.label,
          style: TextStyle(
            color: isLast ? c.text : c.textSecondary,
            fontSize: IDesignTokensLight.fontSizeMd,
            fontWeight: isLast ? FontWeight.w500 : FontWeight.w400,
          ),
        ));
      } else {
        children.add(InkWell(
          onTap: item.onTap,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
          child: Text(
            item.label,
            style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeMd),
          ),
        ));
      }

      if (!isLast) {
        children.add(IIcon(separator, size: 14, color: c.textTertiary));
      }
    }

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: IDesignTokensLight.spacing2,
      runSpacing: IDesignTokensLight.spacing2,
      children: children,
    );
  }
}
