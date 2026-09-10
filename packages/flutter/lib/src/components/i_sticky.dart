import 'package:flutter/material.dart';

/// 吸顶。
///
/// Flutter 里这件事有现成的正确做法：SliverPersistentHeader 的 pinned。
/// 它由布局系统直接算，不经过任何一帧的 JS 回调，也不会在快速滚动时抖——
/// 自己监听滚动再改 offset 只会做出一个更差的版本。
///
/// 因此这一端不引 logic/affix 的判定：那份判定是给没有原生吸顶的环境用的
/// （Web 端需要它来回答「此刻是不是吸住了」）。这里 SliverPersistentHeader
/// 自己就知道，硬套一遍反而多出一处会算错的地方。
class ISticky extends StatelessWidget {
  const ISticky({super.key, required this.child, this.height = 40});

  final Widget child;

  /// 吸顶条的高度。必须固定：Sliver 需要在布局前知道它占多高
  final double height;

  /// 放进 CustomScrollView 的 slivers 里
  Widget toSliver() => SliverPersistentHeader(
        pinned: true,
        delegate: _StickyDelegate(child: child, height: height),
      );

  @override
  Widget build(BuildContext context) => SizedBox(height: height, child: child);
}

class _StickyDelegate extends SliverPersistentHeaderDelegate {
  _StickyDelegate({required this.child, required this.height});

  final Widget child;
  final double height;

  @override
  double get minExtent => height;

  @override
  double get maxExtent => height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) => SizedBox(
        height: height,
        // 吸住后要有底色：透明的话，滚过它下面的内容会从字缝里透出来
        child: Material(color: Theme.of(context).colorScheme.surface, child: child),
      );

  @override
  bool shouldRebuild(_StickyDelegate old) => old.child != child || old.height != height;
}
