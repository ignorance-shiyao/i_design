import 'package:flutter/material.dart';
import '../tokens/tokens.dart';

enum ITagType { normal, brand, success, warning, danger }

/// 标签：语义色与 Web 端同源，圆角与内边距同样取自令牌
class ITag extends StatelessWidget {
  const ITag({super.key, required this.child, this.type = ITagType.normal, this.round = false});

  final Widget child;
  final ITagType type;
  final bool round;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final (Color background, Color foreground) = switch (type) {
      ITagType.normal => (
          isDark ? IDesignTokensDark.colorBgMuted : IDesignTokensLight.colorBgMuted,
          isDark ? IDesignTokensDark.colorTextSecondary : IDesignTokensLight.colorTextSecondary,
        ),
      ITagType.brand => (
          isDark ? IDesignTokensDark.colorBrandSubtle : IDesignTokensLight.colorBrandSubtle,
          isDark ? IDesignTokensDark.colorBrand : IDesignTokensLight.colorBrand,
        ),
      ITagType.success => (
          isDark ? IDesignTokensDark.colorSuccessSubtle : IDesignTokensLight.colorSuccessSubtle,
          isDark ? IDesignTokensDark.colorSuccess : IDesignTokensLight.colorSuccess,
        ),
      ITagType.warning => (
          isDark ? IDesignTokensDark.colorWarningSubtle : IDesignTokensLight.colorWarningSubtle,
          isDark ? IDesignTokensDark.colorWarning : IDesignTokensLight.colorWarning,
        ),
      ITagType.danger => (
          isDark ? IDesignTokensDark.colorDangerSubtle : IDesignTokensLight.colorDangerSubtle,
          isDark ? IDesignTokensDark.colorDanger : IDesignTokensLight.colorDanger,
        ),
    };

    return Container(
      height: 22,
      padding: EdgeInsets.symmetric(
        horizontal: round ? IDesignTokensLight.spacing3 : IDesignTokensLight.spacing2,
      ),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(
          round ? IDesignTokensLight.radiusFull : IDesignTokensLight.radiusSm,
        ),
      ),
      child: DefaultTextStyle(
        style: TextStyle(color: foreground, fontSize: IDesignTokensLight.fontSizeXs),
        child: child,
      ),
    );
  }
}
