import 'package:flutter/material.dart';
import '../tokens/tokens.dart';

enum ISpaceSize { sm, md, lg }

/// 一组元素之间的等距排列。
///
/// 存在的意义是把「相邻元素间距」收敛到令牌上：各处手写 SizedBox(width: 12)
/// 会长出十几种不同的间距，而且删元素时容易留下孤儿间隔。
class ISpace extends StatelessWidget {
  const ISpace({
    super.key,
    required this.children,
    this.direction = Axis.horizontal,
    this.size = ISpaceSize.md,
    this.align = WrapAlignment.start,
    this.wrap = false,
  });

  final List<Widget> children;
  final Axis direction;
  final ISpaceSize size;
  final WrapAlignment align;

  /// 放不下时折行；仅横向有意义
  final bool wrap;

  static double gapOf(ISpaceSize size) => switch (size) {
        ISpaceSize.sm => IDesignTokensLight.spacing2,
        ISpaceSize.md => IDesignTokensLight.spacing3,
        ISpaceSize.lg => IDesignTokensLight.spacing5,
      };

  @override
  Widget build(BuildContext context) {
    final gap = gapOf(size);

    if (wrap && direction == Axis.horizontal) {
      return Wrap(
        spacing: gap,
        runSpacing: gap,
        alignment: align,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: children,
      );
    }

    // Flex 的 spacing 参数在较旧的 Flutter 上不存在，这里手动插入间隔，
    // 保证 3.10 起的各版本行为一致
    final spaced = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) {
        spaced.add(
          direction == Axis.horizontal ? SizedBox(width: gap) : SizedBox(height: gap),
        );
      }
      spaced.add(children[i]);
    }

    return Flex(
      direction: direction,
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: switch (align) {
        WrapAlignment.center => MainAxisAlignment.center,
        WrapAlignment.end => MainAxisAlignment.end,
        WrapAlignment.spaceBetween => MainAxisAlignment.spaceBetween,
        _ => MainAxisAlignment.start,
      },
      crossAxisAlignment:
          direction == Axis.horizontal ? CrossAxisAlignment.center : CrossAxisAlignment.start,
      children: spaced,
    );
  }
}
