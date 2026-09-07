import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

class ITabItem {
  const ITabItem({required this.name, required this.label, this.disabled = false});
  final String name;
  final String label;
  final bool disabled;
}

/// 标签页：在同一块区域内切换并列的内容视图。
/// 页签超过 7 个时改用左侧导航——与其他端同一条建议。
class ITabs extends StatelessWidget {
  const ITabs({
    super.key,
    required this.items,
    required this.value,
    this.onChanged,
    this.child,
  });

  final List<ITabItem> items;
  final String value;
  final ValueChanged<String>? onChanged;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.border))),
          child: Row(
            children: items.map((item) {
              final active = item.name == value;
              return GestureDetector(
                onTap: item.disabled || active ? null : () => onChanged?.call(item.name),
                behavior: HitTestBehavior.opaque,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: IDesignTokensLight.spacing4,
                    vertical: IDesignTokensLight.spacing3,
                  ),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        color: active ? c.brand : Colors.transparent,
                        width: 2,
                      ),
                    ),
                  ),
                  child: Text(
                    item.label,
                    style: TextStyle(
                      color: item.disabled
                          ? c.textTertiary
                          : active
                              ? c.brand
                              : c.textSecondary,
                      fontSize: IDesignTokensLight.fontSizeMd,
                      fontWeight: active ? FontWeight.w500 : FontWeight.w400,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        if (child != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing5),
            child: DefaultTextStyle(
              style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeMd),
              child: child!,
            ),
          ),
      ],
    );
  }
}
