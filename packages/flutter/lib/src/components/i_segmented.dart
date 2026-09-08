import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

@immutable
class ISegmentedOption<T> {
  const ISegmentedOption({required this.label, required this.value, this.disabled = false});

  final String label;
  final T value;
  final bool disabled;
}

/// 分段控制器。
///
/// 与 ITabs 的分工：Tabs 切换的是页面区域，Segmented 切换的是同一块区域内的
/// 数据视角（日/周/月）。滑块用动画位移而不是给选中项加底色，切换时视线不会丢。
class ISegmented<T> extends StatelessWidget {
  const ISegmented({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.block = false,
    this.enabled = true,
  });

  final List<ISegmentedOption<T>> options;
  final T value;
  final ValueChanged<T> onChanged;

  /// 占满整行并等分；默认按文字宽度收窄
  final bool block;
  final bool enabled;

  static const double _padding = 2;
  static const double _itemPaddingX = IDesignTokensLight.spacing4;

  /// 用 TextPainter 量真实文字宽度。
  ///
  /// 不按「字数 × 估计字宽」算：中英文混排时估算能差出一整个字符，
  /// 滑块就会与文字错位——Web 端同样是量出来的，只不过那边量的是 DOM。
  double _measure(String label, TextStyle style, double scale) {
    final painter = TextPainter(
      text: TextSpan(text: label, style: style),
      textDirection: TextDirection.ltr,
      textScaler: TextScaler.linear(scale),
    )..layout();
    return painter.width + _itemPaddingX * 2;
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final scale = MediaQuery.of(context).textScaler.scale(1);
    final baseStyle = TextStyle(
      fontSize: IDesignTokensLight.fontSizeSm,
      fontWeight: FontWeight.w500,
    );

    Widget shell(List<double> widths) {
      final index = options.indexWhere((o) => o.value == value);
      final left = index < 0
          ? 0.0
          : widths.take(index).fold<double>(0, (sum, w) => sum + w);

      return Container(
        padding: const EdgeInsets.all(_padding),
        decoration: BoxDecoration(
          color: c.bgMuted,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Stack(
          children: [
            if (index >= 0)
              AnimatedPositioned(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                left: left,
                top: 0,
                bottom: 0,
                width: widths[index],
                child: Container(
                  decoration: BoxDecoration(
                    color: c.bgElevated,
                    borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd - _padding),
                    boxShadow: const [
                      BoxShadow(color: Color(0x14141822), blurRadius: 4, offset: Offset(0, 1)),
                    ],
                  ),
                ),
              ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (var i = 0; i < options.length; i++)
                  SizedBox(
                    width: widths[i],
                    child: InkWell(
                      onTap: !enabled || options[i].disabled || options[i].value == value
                          ? null
                          : () => onChanged(options[i].value),
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd - _padding),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: IDesignTokensLight.spacing1,
                        ),
                        child: Text(
                          options[i].label,
                          textAlign: TextAlign.center,
                          style: baseStyle.copyWith(
                            color: !enabled || options[i].disabled
                                ? c.textTertiary
                                : (options[i].value == value ? c.text : c.textSecondary),
                            fontWeight:
                                options[i].value == value ? FontWeight.w500 : FontWeight.w400,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      );
    }

    final measured = [for (final o in options) _measure(o.label, baseStyle, scale)];

    if (!block) return shell(measured);

    // 通栏时等分整行宽度
    return LayoutBuilder(
      builder: (context, constraints) {
        final each = (constraints.maxWidth - _padding * 2) / options.length;
        return shell([for (var i = 0; i < options.length; i++) each]);
      },
    );
  }
}
