import 'package:flutter/material.dart';
import '../tokens/tokens.dart';

/// 按钮的视觉层级，与 Web 端的 variant 一一对应
enum IButtonVariant { primary, secondary, text, danger }

/// 尺寸档位与 Web 端一致：sm 28 / md 34 / lg 42
enum IButtonSize { sm, md, lg }

/// Ignorance Design 按钮。
///
/// 颜色与尺寸全部取自 [IDesignTokensLight] / [IDesignTokensDark]——它们由 Web 端
/// 同一份令牌源编译而来，因此这里不会出现「安卓端的品牌蓝比网页浅一点」。
class IButton extends StatelessWidget {
  const IButton({
    super.key,
    required this.child,
    this.onPressed,
    this.variant = IButtonVariant.secondary,
    this.size = IButtonSize.md,
    this.loading = false,
    this.block = false,
  });

  final Widget child;
  final VoidCallback? onPressed;
  final IButtonVariant variant;
  final IButtonSize size;
  final bool loading;
  final bool block;

  bool get _disabled => onPressed == null || loading;

  double get _height => switch (size) {
        IButtonSize.sm => 28.0,
        IButtonSize.md => 34.0,
        IButtonSize.lg => 42.0,
      };

  double get _fontSize => switch (size) {
        IButtonSize.sm => IDesignTokensLight.fontSizeSm,
        IButtonSize.md => IDesignTokensLight.fontSizeMd,
        IButtonSize.lg => IDesignTokensLight.fontSizeLg,
      };

  EdgeInsets get _padding => switch (size) {
        IButtonSize.sm => const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3),
        IButtonSize.md => const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing4),
        IButtonSize.lg => const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing6),
      };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final brand = isDark ? IDesignTokensDark.colorBrand : IDesignTokensLight.colorBrand;
    final danger = isDark ? IDesignTokensDark.colorDanger : IDesignTokensLight.colorDanger;
    final text = isDark ? IDesignTokensDark.colorText : IDesignTokensLight.colorText;
    final bg = isDark ? IDesignTokensDark.colorBgElevated : IDesignTokensLight.colorBgElevated;
    final border = isDark ? IDesignTokensDark.colorBorder : IDesignTokensLight.colorBorder;
    final brandSubtle =
        isDark ? IDesignTokensDark.colorBrandSubtle : IDesignTokensLight.colorBrandSubtle;

    final (Color background, Color foreground, Color borderColor) = switch (variant) {
      IButtonVariant.primary => (brand, Colors.white, Colors.transparent),
      IButtonVariant.secondary => (bg, text, border),
      IButtonVariant.text => (Colors.transparent, brand, Colors.transparent),
      IButtonVariant.danger => (danger, Colors.white, Colors.transparent),
    };

    return Opacity(
      opacity: _disabled ? 0.5 : 1,
      child: Material(
        color: background,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        child: InkWell(
          onTap: _disabled ? null : onPressed,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          hoverColor: variant == IButtonVariant.text ? brandSubtle : null,
          child: Container(
            height: _height,
            width: block ? double.infinity : null,
            padding: _padding,
            decoration: BoxDecoration(
              border: Border.all(color: borderColor),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: Row(
              mainAxisSize: block ? MainAxisSize.max : MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (loading) ...[
                  SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 2, color: foreground),
                  ),
                  const SizedBox(width: IDesignTokensLight.spacing2),
                ],
                DefaultTextStyle(
                  style: TextStyle(
                    color: foreground,
                    fontSize: _fontSize,
                    fontWeight: FontWeight.w500,
                  ),
                  child: child,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
