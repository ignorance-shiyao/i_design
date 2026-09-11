import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 侧边悬浮工具条的一项
class IStickyToolItem {
  const IStickyToolItem({
    required this.value,
    required this.label,
    required this.icon,
    this.disabled = false,
  });

  final String value;
  final String label;

  /// 图标名，取自公共图标表
  final String icon;
  final bool disabled;
}

/// 侧边悬浮工具条：客服、反馈、回到顶部这类跟着页面走的入口。
///
/// 竖排而不是横排：横排会占掉正文的宽度，而这些入口的重要性远低于正文。
/// 用 Positioned 由调用方放进 Stack，不自己接管定位——
/// 它贴的是「页面」还是「某个滚动区」，只有调用方知道。
class IStickyTool extends StatelessWidget {
  const IStickyTool({
    super.key,
    required this.items,
    this.active = '',
    this.onTapItem,
  });

  final List<IStickyToolItem> items;
  final String active;
  final ValueChanged<IStickyToolItem>? onTapItem;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Container(
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.border),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final (index, item) in items.indexed)
            InkWell(
              onTap: item.disabled ? null : () => onTapItem?.call(item),
              child: Container(
                width: 56,
                padding: const EdgeInsets.symmetric(
                  vertical: IDesignTokensLight.spacing3,
                  horizontal: IDesignTokensLight.spacing1,
                ),
                decoration: BoxDecoration(
                  color: active == item.value ? c.brandSubtle : null,
                  // 分隔用发丝线，四边等宽；不靠某一条加粗的边表达选中
                  border: index == 0
                      ? null
                      : Border(top: BorderSide(color: c.hairline)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IIcon(
                      item.icon,
                      size: 18,
                      color: item.disabled
                          ? c.textTertiary
                          : active == item.value
                              ? c.brand
                              : c.textSecondary,
                    ),
                    const SizedBox(height: 2),
                    // 图标之外始终给文字：图标不是所有人都能一眼认出来
                    Text(
                      item.label,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: item.disabled
                            ? c.textTertiary
                            : active == item.value
                                ? c.brand
                                : c.textSecondary,
                        fontSize: IDesignTokensLight.fontSizeXs,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
