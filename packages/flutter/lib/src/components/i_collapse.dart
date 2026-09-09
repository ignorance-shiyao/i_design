import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

@immutable
class ICollapseItem {
  const ICollapseItem({
    required this.name,
    required this.title,
    required this.content,
    this.disabled = false,
  });

  final String name;
  final String title;
  final Widget content;
  final bool disabled;
}

/// 折叠面板。
///
/// 展开态由外部持有（受控），与 Web 端同一套用法：
/// accordion 为 true 时同时最多展开一项。
class ICollapse extends StatelessWidget {
  const ICollapse({
    super.key,
    required this.items,
    required this.expanded,
    required this.onChanged,
    this.accordion = false,
    this.bordered = true,
  });

  final List<ICollapseItem> items;
  final List<String> expanded;
  final ValueChanged<List<String>> onChanged;
  final bool accordion;
  final bool bordered;

  void _toggle(ICollapseItem item) {
    if (item.disabled) return;
    final isOpen = expanded.contains(item.name);
    if (accordion) {
      onChanged(isOpen ? const [] : [item.name]);
      return;
    }
    final next = List<String>.from(expanded);
    isOpen ? next.remove(item.name) : next.add(item.name);
    onChanged(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        border: bordered ? Border.all(color: c.border) : null,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < items.length; i++)
            Builder(builder: (context) {
              final item = items[i];
              final isOpen = expanded.contains(item.name);
              final titleColor = item.disabled ? c.textTertiary : c.text;

              return Container(
                decoration: BoxDecoration(
                  border: i == 0 ? null : Border(top: BorderSide(color: c.hairline)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    InkWell(
                      onTap: item.disabled ? null : () => _toggle(item),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: IDesignTokensLight.spacing4,
                          vertical: IDesignTokensLight.spacing3,
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                item.title,
                                style: TextStyle(
                                  color: titleColor,
                                  fontSize: IDesignTokensLight.fontSizeMd,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            AnimatedRotation(
                              turns: isOpen ? 0.25 : 0,
                              duration: const Duration(milliseconds: 200),
                              child: IIcon('chevron-right', size: 16, color: c.textTertiary),
                            ),
                          ],
                        ),
                      ),
                    ),
                    AnimatedCrossFade(
                      firstChild: const SizedBox(width: double.infinity),
                      secondChild: Padding(
                        padding: const EdgeInsets.fromLTRB(
                          IDesignTokensLight.spacing4,
                          0,
                          IDesignTokensLight.spacing4,
                          IDesignTokensLight.spacing4,
                        ),
                        child: DefaultTextStyle(
                          style: TextStyle(
                            color: c.textSecondary,
                            fontSize: IDesignTokensLight.fontSizeMd,
                            height: 1.6,
                          ),
                          child: item.content,
                        ),
                      ),
                      crossFadeState:
                          isOpen ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                      duration: const Duration(milliseconds: 200),
                      sizeCurve: Curves.easeOut,
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}
