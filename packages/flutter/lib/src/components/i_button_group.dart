import 'package:flutter/material.dart';
import '../tokens/tokens.dart';

/// 一组紧挨着的按钮，表达「同一类操作的几个变体」。
///
/// Flutter 没有 CSS 的负边距合并边框那一套，改用 ClipRRect 统一裁圆角、
/// 中间用一条发丝线分隔：视觉结果与 Web 端一致——外圆内直、中缝只有一条线。
class IButtonGroup extends StatelessWidget {
  const IButtonGroup({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      child: Row(mainAxisSize: MainAxisSize.min, children: children),
    );
  }
}
