import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 追问建议。
///
/// 放在回答之后而不是输入框上方：它们是对这一轮回答的延伸，
/// 挪到输入框旁边就变成了与上下文无关的通用入口。
class IChatSuggestions extends StatelessWidget {
  const IChatSuggestions({
    super.key,
    required this.items,
    required this.onSelect,
    this.title = '你可以接着问',
  });

  final List<String> items;
  final ValueChanged<String> onSelect;
  final String title;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    final c = iColorsOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          Text(
            title,
            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
          ),
          const SizedBox(height: IDesignTokensLight.spacing2),
        ],
        Wrap(
          spacing: IDesignTokensLight.spacing2,
          runSpacing: IDesignTokensLight.spacing2,
          children: [
            for (final item in items)
              InkWell(
                onTap: () => onSelect(item),
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: IDesignTokensLight.spacing3,
                    vertical: IDesignTokensLight.spacing2,
                  ),
                  decoration: BoxDecoration(
                    color: c.bgElevated,
                    border: Border.all(color: c.border),
                    borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
                  ),
                  child: Text(
                    item,
                    style: TextStyle(
                      color: c.textSecondary,
                      fontSize: IDesignTokensLight.fontSizeSm,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}
