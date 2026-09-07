import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_avatar.dart';

/// 头像组：重叠排列，超出 max 的部分折成 +N。
///
/// 重叠用负 margin 实现，overlap 取头像直径的比例而非固定像素，
/// 否则换尺寸时叠压程度会失真。
class IAvatarGroup extends StatelessWidget {
  const IAvatarGroup({
    super.key,
    required this.names,
    this.max,
    this.size = 32,
    this.overlap = 0.3,
  });

  final List<String> names;

  /// 最多展示几个；其余折叠为 +N
  final int? max;
  final double size;

  /// 相邻头像的重叠比例（0 ~ 0.5）
  final double overlap;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final limit = max == null ? names.length : max!.clamp(0, names.length);
    final shown = names.take(limit).toList();
    final rest = names.length - shown.length;
    final shift = size * overlap.clamp(0.0, 0.5);

    Widget ring(Widget child) => Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: c.bg, width: 2),
          ),
          child: child,
        );

    // 用 Stack + Positioned 而不是负 padding：Padding 断言内边距非负，
    // 负 margin 那套 CSS 写法在 Flutter 里直接抛错。
    final tiles = <Widget>[
      for (final name in shown) ring(IAvatar(name: name, size: size)),
      if (rest > 0)
        ring(Container(
          width: size,
          height: size,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: c.bgMuted, shape: BoxShape.circle),
          child: Text(
            '+$rest',
            style: TextStyle(
              color: c.textSecondary,
              fontSize: size * 0.36,
              fontWeight: FontWeight.w500,
            ),
          ),
        )),
    ];

    if (tiles.isEmpty) return const SizedBox.shrink();

    final step = size - shift;
    final ringed = size + 4; // 两侧各 2px 描边

    return SizedBox(
      height: ringed,
      width: step * (tiles.length - 1) + ringed,
      child: Stack(
        children: [
          for (var i = 0; i < tiles.length; i++)
            Positioned(left: i * step, top: 0, child: tiles[i]),
        ],
      ),
    );
  }
}
