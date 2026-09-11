import 'package:flutter/material.dart';

/// 滚动容器。
///
/// Flutter 已经有 Scrollbar，且它的外观由主题统一控制——再自绘一条只会同时出现两条。
/// 这一端因此是薄封装：统一默认值（常驻显示、圆角滑块），保证跨端用法一致。
class IScrollbar extends StatelessWidget {
  const IScrollbar({
    super.key,
    required this.child,
    this.height,
    this.maxHeight,
    this.always = false,
  });

  final Widget child;
  final double? height;
  final double? maxHeight;

  /// 一直显示滚动条，而不是滚动时才出现
  final bool always;

  @override
  Widget build(BuildContext context) {
    final controller = ScrollController();

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: maxHeight ?? height ?? double.infinity,
      ),
      child: SizedBox(
        height: height,
        child: Scrollbar(
          controller: controller,
          thumbVisibility: always,
          radius: const Radius.circular(999),
          child: SingleChildScrollView(controller: controller, child: child),
        ),
      ),
    );
  }
}
