import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 页头：返回、标题、副标题、右侧操作。
///
/// 返回键与标题同一行而不是叠在标题上方：叠起来会让标题看着像副标题，
/// 而它是这一页最重要的那行字。
class IPageHeader extends StatelessWidget {
  const IPageHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.backText = '返回',
    this.back = true,
    this.onBack,
    this.extra = const [],
    this.content,
  });

  final String title;
  final String? subtitle;
  final String backText;

  /// 不需要返回时整块去掉，而不是留一个点不动的箭头
  final bool back;
  final VoidCallback? onBack;
  final List<Widget> extra;
  final Widget? content;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Container(
      padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing4),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: c.hairline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (back) ...[
                GestureDetector(
                  onTap: onBack,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IIcon('chevron-left', size: 18, color: c.textSecondary),
                      if (backText.isNotEmpty)
                        Text(
                          backText,
                          style: TextStyle(
                            color: c.textSecondary,
                            fontSize: IDesignTokensLight.fontSizeMd,
                          ),
                        ),
                    ],
                  ),
                ),
                // 返回与标题之间的竖线：两段文字挨着时读起来是一句话
                Container(
                  width: 1,
                  height: 16,
                  margin: const EdgeInsets.symmetric(
                    horizontal: IDesignTokensLight.spacing3,
                  ),
                  color: c.border,
                ),
              ],
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Flexible(
                      child: Text(
                        title,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: c.text,
                          fontSize: IDesignTokensLight.fontSizeXl,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(width: IDesignTokensLight.spacing2),
                      Flexible(
                        child: Text(
                          subtitle!,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: c.textTertiary,
                            fontSize: IDesignTokensLight.fontSizeSm,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              ...extra,
            ],
          ),
          if (content != null)
            Padding(
              padding: const EdgeInsets.only(top: IDesignTokensLight.spacing3),
              child: content,
            ),
        ],
      ),
    );
  }
}
