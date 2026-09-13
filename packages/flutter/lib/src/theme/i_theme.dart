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
    required this.onMedia,
    required this.bgMuted,
    required this.text,
    required this.textSecondary,
    required this.textTertiary,
    required this.border,
    required this.borderStrong,
    required this.chartDiv1,
    required this.chartDiv5,
    required this.hairline,
    required this.codeBg,
    required this.codeBar,
    required this.codeBorder,
    required this.codeText,
    required this.codeMuted,
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

  /// 压在图片、视频上的前景色。明暗两个主题都是白——
  /// 它面对的不是主题底色而是任意媒体内容，跟着主题翻就会消失在深色照片里
  final Color onMedia;
  final Color bgMuted;
  final Color text;
  final Color textSecondary;
  final Color textTertiary;
  final Color border;
  final Color borderStrong;

  /*
   * 双向色阶的两端。放进主题而不是直接引 IDesignTokensLight——
   * 亮色的冷极在深色背景上对比度只有 2.3:1，柱子几乎看不见，
   * 因此明暗两套是分别选的步进，必须跟着主题切换。
   */
  final Color chartDiv1;
  final Color chartDiv5;
  final Color hairline;

  /* 代码块的一套底色：亮暗两套差别很大，不能拿常规背景色凑合 */
  final Color codeBg;
  final Color codeBar;
  final Color codeBorder;
  final Color codeText;
  final Color codeMuted;

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
    onMedia: IDesignTokensLight.colorOnMedia,
    bgMuted: IDesignTokensLight.colorBgMuted,
    text: IDesignTokensLight.colorText,
    textSecondary: IDesignTokensLight.colorTextSecondary,
    textTertiary: IDesignTokensLight.colorTextTertiary,
    border: IDesignTokensLight.colorBorder,
    borderStrong: IDesignTokensLight.colorBorderStrong,
    chartDiv1: IDesignTokensLight.chartDiv1,
    chartDiv5: IDesignTokensLight.chartDiv5,
    hairline: IDesignTokensLight.colorHairline,
    codeBg: IDesignTokensLight.colorCodeBg,
    codeBar: IDesignTokensLight.colorCodeBar,
    codeBorder: IDesignTokensLight.colorCodeBorder,
    codeText: IDesignTokensLight.colorCodeText,
    codeMuted: IDesignTokensLight.colorCodeMuted,
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
    onMedia: IDesignTokensDark.colorOnMedia,
    bgMuted: IDesignTokensDark.colorBgMuted,
    text: IDesignTokensDark.colorText,
    textSecondary: IDesignTokensDark.colorTextSecondary,
    textTertiary: IDesignTokensDark.colorTextTertiary,
    border: IDesignTokensDark.colorBorder,
    borderStrong: IDesignTokensDark.colorBorderStrong,
    chartDiv1: IDesignTokensDark.chartDiv1,
    chartDiv5: IDesignTokensDark.chartDiv5,
    hairline: IDesignTokensDark.colorHairline,
    codeBg: IDesignTokensDark.colorCodeBg,
    codeBar: IDesignTokensDark.colorCodeBar,
    codeBorder: IDesignTokensDark.colorCodeBorder,
    codeText: IDesignTokensDark.colorCodeText,
    codeMuted: IDesignTokensDark.colorCodeMuted,
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
