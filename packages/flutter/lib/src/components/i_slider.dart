import 'package:flutter/material.dart';
import '../logic/number.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

@immutable
class ISliderMark {
  const ISliderMark({required this.value, this.label});

  final double value;
  final String? label;
}

/// 在连续区间里取值。
///
/// 不直接用 Material 的 Slider：它的滑块尺寸、轨道高度与选中色都由 Material 主题
/// 决定，与本体系的令牌对不上。这里自绘，取值规则来自 logic/number.dart。
class ISlider extends StatelessWidget {
  const ISlider({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 0,
    this.max = 100,
    this.step = 1,
    this.precision = 0,
    this.enabled = true,
    this.marks = const [],
  });

  final double value;
  final ValueChanged<double> onChanged;
  final double min;
  final double max;
  final double step;
  final int precision;
  final bool enabled;
  final List<ISliderMark> marks;

  static const double _handle = 16;

  void _applyAt(double dx, double width) {
    if (!enabled || width <= 0) return;
    final next = valueFromRatio(dx / width, min, max, step, precision);
    if (next != value) onChanged(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final ratio = ratioOf(value, min, max);
    final hasLabel = marks.any((m) => m.label != null);

    return LayoutBuilder(
      builder: (context, constraints) {
        // 轨道两端各留半个滑块，否则 0% 与 100% 时滑块会被裁掉一半
        final width = constraints.maxWidth - _handle;

        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: (d) => _applyAt(d.localPosition.dx - _handle / 2, width),
          onHorizontalDragUpdate: (d) => _applyAt(d.localPosition.dx - _handle / 2, width),
          child: SizedBox(
            height: hasLabel ? 40 : 20,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  left: _handle / 2,
                  right: _handle / 2,
                  top: 8,
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: c.bgMuted,
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
                    ),
                  ),
                ),
                Positioned(
                  left: _handle / 2,
                  top: 8,
                  child: Container(
                    height: 4,
                    width: width * ratio,
                    decoration: BoxDecoration(
                      color: enabled ? c.brand : c.borderStrong,
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
                    ),
                  ),
                ),

                for (final mark in marks) ...[
                  Positioned(
                    left: _handle / 2 + width * ratioOf(mark.value, min, max) - 3,
                    top: 7,
                    child: Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: mark.value <= value ? c.brand : c.borderStrong,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  if (mark.label != null)
                    Positioned(
                      left: _handle / 2 + width * ratioOf(mark.value, min, max) - 20,
                      top: 22,
                      width: 40,
                      child: Text(
                        mark.label!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: c.textTertiary,
                          fontSize: IDesignTokensLight.fontSizeXs,
                        ),
                      ),
                    ),
                ],

                Positioned(
                  left: width * ratio,
                  top: 2,
                  child: Opacity(
                    opacity: enabled ? 1 : 0.6,
                    child: Container(
                      width: _handle,
                      height: _handle,
                      decoration: BoxDecoration(
                        color: c.bg,
                        shape: BoxShape.circle,
                        border: Border.all(color: c.brand, width: 2),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
