import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 列表单元格：移动端最常见的一行。
///
/// 分隔线画在单元格内部并留出左侧缩进，与 iOS / Android 的列表惯例一致——
/// 通栏分隔线会让图标与文字看起来不在同一组。
class ICell extends StatelessWidget {
  const ICell({
    super.key,
    required this.title,
    this.description,
    this.value,
    this.leading,
    this.trailing,
    this.onTap,
    this.showArrow = false,
    this.bordered = true,
  });

  final String title;
  final String? description;
  final String? value;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool showArrow;

  /// 底部分隔线；一组的最后一项通常传 false
  final bool bordered;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return InkWell(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 48),
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing4,
          vertical: IDesignTokensLight.spacing3,
        ),
        decoration: BoxDecoration(
          color: c.bg,
          border: bordered ? Border(bottom: BorderSide(color: c.hairline)) : null,
        ),
        child: Row(
          children: [
            if (leading != null) ...[
              leading!,
              const SizedBox(width: IDesignTokensLight.spacing3),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
                  ),
                  if (description != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      description!,
                      style: TextStyle(
                        color: c.textTertiary,
                        fontSize: IDesignTokensLight.fontSizeSm,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (value != null)
              Padding(
                padding: const EdgeInsets.only(left: IDesignTokensLight.spacing3),
                child: Text(
                  value!,
                  style: TextStyle(
                    color: c.textSecondary,
                    fontSize: IDesignTokensLight.fontSizeMd,
                  ),
                ),
              ),
            if (trailing != null)
              Padding(
                padding: const EdgeInsets.only(left: IDesignTokensLight.spacing2),
                child: trailing!,
              ),
            if (showArrow)
              Padding(
                padding: const EdgeInsets.only(left: IDesignTokensLight.spacing2),
                child: IIcon('chevron-right', size: 16, color: c.textTertiary),
              ),
          ],
        ),
      ),
    );
  }
}
