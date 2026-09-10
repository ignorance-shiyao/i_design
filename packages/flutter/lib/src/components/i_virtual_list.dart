import 'package:flutter/material.dart';
import '../logic/virtual.dart';

/// 虚拟滚动。
///
/// Flutter 的 ListView.builder 本来就是懒构建的，所以这里不必自己撑空白；
/// 但「窗口取到哪里」仍与其余端共用同一份判定——否则同一份数据在 Web 上
/// 多渲染三行、在这里多渲染十行，滚动到边缘时的表现就对不上。
class IVirtualList<T> extends StatefulWidget {
  const IVirtualList({
    super.key,
    required this.items,
    required this.itemBuilder,
    this.itemHeight = 40,
    this.height = 320,
    this.controller,
  });

  final List<T> items;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;

  /// 每行高度，像素。定高才能不量元素直接算窗口
  final double itemHeight;
  final double height;
  final ScrollController? controller;

  @override
  State<IVirtualList<T>> createState() => _IVirtualListState<T>();
}

class _IVirtualListState<T> extends State<IVirtualList<T>> {
  late final ScrollController _controller = widget.controller ?? ScrollController();

  @override
  void dispose() {
    if (widget.controller == null) _controller.dispose();
    super.dispose();
  }

  /// 把某一行滚到视野里。已经完整可见就不动——
  /// 每次都滚到顶部的话，用户会觉得列表在自己乱跳
  void scrollTo(int index) {
    if (!_controller.hasClients) return;
    _controller.jumpTo(
      scrollToRow(index, widget.itemHeight, _controller.position.pixels, widget.height),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      child: Semantics(
        // 行数报给读屏：只渲染一屏时，读屏问「一共几条」得有人回答
        child: ListView.builder(
          controller: _controller,
          itemCount: widget.items.length,
          itemExtent: widget.itemHeight,
          // cacheExtent 换算成与其余端相同的 overscan 行数，
          // 让「边缘会不会闪白」这件事在各端一致
          cacheExtent: widget.itemHeight * 3,
          itemBuilder: (context, i) => widget.itemBuilder(context, widget.items[i], i),
        ),
      ),
    );
  }
}
