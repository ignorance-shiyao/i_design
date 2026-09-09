import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 评分。
///
/// 未选中的星形保留描边而不是整片变浅：全灰的星形在深色模式下几乎看不见，
/// 用户不知道总共可以打几分。
class IRate extends StatelessWidget {
  const IRate({
    super.key,
    required this.value,
    this.onChanged,
    this.count = 5,
    this.half = false,
    this.size = 18,
    this.text = '',
  });

  final double value;

  /// 不传即为只读
  final ValueChanged<double>? onChanged;
  final int count;

  /// 允许半星：点在星形左半边即为 x.5
  final bool half;
  final double size;

  /// 右侧文案，如「4.5 分」
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final interactive = onChanged != null;

    Widget star(int index) {
      final filled = value >= index + 1;
      final halfOn = half && value >= index + 0.5 && value < index + 1;

      final icon = Stack(
        children: [
          IIcon('sparkle', size: size, color: filled ? c.warning : c.borderStrong),
          if (halfOn)
            // 半星：把实心星裁掉右半边盖在描边星上
            ClipRect(
              clipper: _HalfClipper(),
              child: IIcon('sparkle', size: size, color: c.warning),
            ),
        ],
      );

      if (!interactive) return icon;

      return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (details) {
          final next = half && details.localPosition.dx < size / 2 ? index + 0.5 : index + 1.0;
          // 再点一次同一个值即清零，与 Web 端一致
          onChanged!(next == value ? 0 : next);
        },
        child: icon,
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < count; i++)
          Padding(
            padding: EdgeInsets.only(left: i == 0 ? 0 : IDesignTokensLight.spacing1),
            child: star(i),
          ),
        if (text.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(left: IDesignTokensLight.spacing2),
            child: Text(
              text,
              style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm),
            ),
          ),
      ],
    );
  }
}

class _HalfClipper extends CustomClipper<Rect> {
  @override
  Rect getClip(Size size) => Rect.fromLTWH(0, 0, size.width / 2, size.height);

  @override
  bool shouldReclip(covariant CustomClipper<Rect> oldClipper) => false;
}
