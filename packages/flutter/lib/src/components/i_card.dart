import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 卡片：承载一组相关信息。同级卡片应保持等宽等高，避免视觉上的主次误读。
class ICard extends StatelessWidget {
  const ICard({super.key, required this.child, this.title, this.footer, this.bordered = true});

  final Widget child;
  final String? title;
  final Widget? footer;
  final bool bordered;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return Container(
      decoration: BoxDecoration(
        color: c.bgElevated,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusXl),
        border: bordered ? Border.all(color: c.hairline) : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (title != null)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing5,
                vertical: IDesignTokensLight.spacing4,
              ),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: c.hairline)),
              ),
              child: Text(
                title!,
                style: TextStyle(
                  color: c.text,
                  fontSize: IDesignTokensLight.fontSizeLg,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing5),
            child: DefaultTextStyle(
              style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeMd),
              child: child,
            ),
          ),
          if (footer != null)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing5,
                vertical: IDesignTokensLight.spacing3,
              ),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: c.hairline)),
              ),
              child: footer,
            ),
        ],
      ),
    );
  }
}
