import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum ITypoVariant { h1, h2, h3, h4, h5, body, caption }

enum ITypoTone { normal, secondary, tertiary, brand, success, warning, danger }

/// 标题、正文与辅助文字。
///
/// 字号与行高全部取自令牌，不接受任意数值：排版一旦允许「就这里大一号」，
/// 一个产品里很快会出现七种正文字号。
class ITypography extends StatelessWidget {
  const ITypography(
    this.text, {
    super.key,
    this.variant = ITypoVariant.body,
    this.tone = ITypoTone.normal,
    this.strong = false,
    this.italic = false,
    this.underline = false,
    this.del = false,
    this.mono = false,
    this.maxLines,
    this.ellipsisTooltip = false,
    this.textAlign,
  });

  final String text;
  final ITypoVariant variant;
  final ITypoTone tone;
  final bool strong;
  final bool italic;
  final bool underline;

  /// 删除线，用于表示已失效的值
  final bool del;
  final bool mono;

  /// 超出后省略；对应 Web 端的 ellipsis
  final int? maxLines;

  /// 截断时把完整内容放进长按提示。
  ///
  /// 这一端用 LayoutBuilder + TextPainter 实地量一次，而不是照搬 Web 端的
  /// scrollWidth 比较——那两个值在 Flutter 里没有对应物。判定方向仍是同一条：
  /// 单行看宽度、多行看高度。
  final bool ellipsisTooltip;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    final (double fontSize, FontWeight weight, double height) = switch (variant) {
      ITypoVariant.h1 => (IDesignTokensLight.fontSize4xl, FontWeight.w600, 1.25),
      ITypoVariant.h2 => (IDesignTokensLight.fontSize3xl, FontWeight.w600, 1.3),
      ITypoVariant.h3 => (IDesignTokensLight.fontSize2xl, FontWeight.w600, 1.35),
      ITypoVariant.h4 => (IDesignTokensLight.fontSizeXl, FontWeight.w600, 1.4),
      ITypoVariant.h5 => (IDesignTokensLight.fontSizeLg, FontWeight.w600, 1.5),
      ITypoVariant.body => (IDesignTokensLight.fontSizeMd, FontWeight.w400, 1.75),
      ITypoVariant.caption => (IDesignTokensLight.fontSizeSm, FontWeight.w400, 1.6),
    };

    final color = switch (tone) {
      ITypoTone.normal => c.text,
      ITypoTone.secondary => c.textSecondary,
      ITypoTone.tertiary => c.textTertiary,
      ITypoTone.brand => c.brand,
      ITypoTone.success => c.success,
      ITypoTone.warning => c.warning,
      ITypoTone.danger => c.danger,
    };

    final content = Text(
      text,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: maxLines == null ? null : TextOverflow.ellipsis,
      style: TextStyle(
        fontSize: fontSize,
        // strong 只在正文上有意义：标题本来就是 600，再加粗会顶到 700 之外
        fontWeight: strong && weight == FontWeight.w400 ? FontWeight.w600 : weight,
        height: height,
        color: del ? c.textTertiary : color,
        fontStyle: italic ? FontStyle.italic : FontStyle.normal,
        fontFamily: mono ? 'monospace' : null,
        decoration: del
            ? TextDecoration.lineThrough
            : (underline ? TextDecoration.underline : TextDecoration.none),
      ),
    );

    if (!ellipsisTooltip || maxLines == null) return content;

    return LayoutBuilder(
      builder: (_, constraints) {
        final painter = TextPainter(
          text: TextSpan(text: text, style: content.style),
          maxLines: maxLines,
          textAlign: textAlign,
          textDirection: Directionality.of(context),
        )..layout(maxWidth: constraints.maxWidth);

        // 只有真的截断了才挂提示：没截断也挂的话，长按任意一行都会冒出一个
        // 与正文一字不差的浮层
        if (!painter.didExceedMaxLines) return content;
        return Tooltip(message: text, child: content);
      },
    );
  }
}
