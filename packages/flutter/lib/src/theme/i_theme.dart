import 'package:flutter/material.dart';
import '../tokens/tokens.dart';

/// 一组语义化的颜色与尺寸，供所有组件取用。
///
/// 每个组件各自判断 brightness 会写出大量重复的三元表达式，
/// 也很容易漏掉某一处导致深色模式下出现一块亮斑。这里集中解析一次。
@immutable
class IColors {
  const IColors({
    required this.brand,
    required this.brandHover,
    required this.brandSubtle,
    required this.bg,
    required this.bgElevated,
    required this.bgSubtle,
    required this.bgMuted,
    required this.text,
    required this.textSecondary,
    required this.textTertiary,
    required this.border,
    required this.borderStrong,
    required this.hairline,
    required this.success,
    required this.successSubtle,
    required this.warning,
    required this.warningSubtle,
    required this.danger,
    required this.dangerSubtle,
    required this.info,
    required this.infoSubtle,
  });

  final Color brand;
  final Color brandHover;
  final Color brandSubtle;
  final Color bg;
  final Color bgElevated;
  final Color bgSubtle;
  final Color bgMuted;
  final Color text;
  final Color textSecondary;
  final Color textTertiary;
  final Color border;
  final Color borderStrong;
  final Color hairline;
  final Color success;
  final Color successSubtle;
  final Color warning;
  final Color warningSubtle;
  final Color danger;
  final Color dangerSubtle;
  final Color info;
  final Color infoSubtle;

  static const IColors light = IColors(
    brand: IDesignTokensLight.colorBrand,
    brandHover: IDesignTokensLight.colorBrandHover,
    brandSubtle: IDesignTokensLight.colorBrandSubtle,
    bg: IDesignTokensLight.colorBg,
    bgElevated: IDesignTokensLight.colorBgElevated,
    bgSubtle: IDesignTokensLight.colorBgSubtle,
    bgMuted: IDesignTokensLight.colorBgMuted,
    text: IDesignTokensLight.colorText,
    textSecondary: IDesignTokensLight.colorTextSecondary,
    textTertiary: IDesignTokensLight.colorTextTertiary,
    border: IDesignTokensLight.colorBorder,
    borderStrong: IDesignTokensLight.colorBorderStrong,
    hairline: IDesignTokensLight.colorHairline,
    success: IDesignTokensLight.colorSuccess,
    successSubtle: IDesignTokensLight.colorSuccessSubtle,
    warning: IDesignTokensLight.colorWarning,
    warningSubtle: IDesignTokensLight.colorWarningSubtle,
    danger: IDesignTokensLight.colorDanger,
    dangerSubtle: IDesignTokensLight.colorDangerSubtle,
    info: IDesignTokensLight.colorInfo,
    infoSubtle: IDesignTokensLight.colorInfoSubtle,
  );

  static const IColors dark = IColors(
    brand: IDesignTokensDark.colorBrand,
    brandHover: IDesignTokensDark.colorBrandHover,
    brandSubtle: IDesignTokensDark.colorBrandSubtle,
    bg: IDesignTokensDark.colorBg,
    bgElevated: IDesignTokensDark.colorBgElevated,
    bgSubtle: IDesignTokensDark.colorBgSubtle,
    bgMuted: IDesignTokensDark.colorBgMuted,
    text: IDesignTokensDark.colorText,
    textSecondary: IDesignTokensDark.colorTextSecondary,
    textTertiary: IDesignTokensDark.colorTextTertiary,
    border: IDesignTokensDark.colorBorder,
    borderStrong: IDesignTokensDark.colorBorderStrong,
    hairline: IDesignTokensDark.colorHairline,
    success: IDesignTokensDark.colorSuccess,
    successSubtle: IDesignTokensDark.colorSuccessSubtle,
    warning: IDesignTokensDark.colorWarning,
    warningSubtle: IDesignTokensDark.colorWarningSubtle,
    danger: IDesignTokensDark.colorDanger,
    dangerSubtle: IDesignTokensDark.colorDangerSubtle,
    info: IDesignTokensDark.colorInfo,
    infoSubtle: IDesignTokensDark.colorInfoSubtle,
  );
}

/// 按当前主题取色；组件里统一写 `final c = IColors.of(context);`
extension IColorsOf on IColors {
  static IColors resolve(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? IColors.dark : IColors.light;
}

/// 便捷入口
IColors iColorsOf(BuildContext context) => IColorsOf.resolve(context);

/// 尺寸档位，与 Web 端一致：sm 28 / md 34 / lg 42
enum ISize { sm, md, lg }

double iControlHeight(ISize size) => switch (size) {
      ISize.sm => 28.0,
      ISize.md => 34.0,
      ISize.lg => 42.0,
    };

double iFontSize(ISize size) => switch (size) {
      ISize.sm => IDesignTokensLight.fontSizeSm,
      ISize.md => IDesignTokensLight.fontSizeMd,
      ISize.lg => IDesignTokensLight.fontSizeLg,
    };
