/// 虚拟滚动窗口计算的 Dart 移植（对应 packages/common/src/logic/virtual.ts）。
///
/// Flutter 的 ListView.builder 本来就是懒构建的，但「窗口该取到哪里」
/// 仍要与其余端一致——否则同一份数据在 Web 上多渲染三行、在这里多渲染十行，
/// 滚动到边缘时的表现就对不上。
library;

import 'dart:math' as math;

class IVirtualWindow {
  const IVirtualWindow({
    required this.start,
    required this.end,
    required this.paddingTop,
    required this.paddingBottom,
    required this.totalHeight,
  });

  /// 要渲染的第一行下标
  final int start;

  /// 要渲染的最后一行下标（含）
  final int end;

  /// 顶部撑开的高度，把可见行顶到正确位置
  final double paddingTop;

  /// 底部撑开的高度，保证滚动条长度正确
  final double paddingBottom;
  final double totalHeight;

  @override
  bool operator ==(Object other) =>
      other is IVirtualWindow &&
      other.start == start &&
      other.end == end &&
      other.paddingTop == paddingTop &&
      other.paddingBottom == paddingBottom &&
      other.totalHeight == totalHeight;

  @override
  int get hashCode => Object.hash(start, end, paddingTop, paddingBottom, totalHeight);

  @override
  String toString() => 'IVirtualWindow($start..$end)';
}

/// 定高行的可见窗口。
///
/// overscan 默认 3 行：再少，快速拖动滚动条时上下边缘会闪出空白；
/// 再多，收益已经没有了——多渲染的那些行永远来不及被看见。
IVirtualWindow virtualWindow(
  double scrollTop,
  double viewportHeight,
  double itemHeight,
  int count, {
  int overscan = 3,
}) {
  final totalHeight = itemHeight * count;
  if (count <= 0 || itemHeight <= 0) {
    return const IVirtualWindow(start: 0, end: -1, paddingTop: 0, paddingBottom: 0, totalHeight: 0);
  }

  final first = (scrollTop / itemHeight).floor();
  final visible = (viewportHeight / itemHeight).ceil();
  final start = math.max(0, first - overscan);
  final end = math.min(count - 1, first + visible + overscan);

  return IVirtualWindow(
    start: start,
    end: end,
    paddingTop: start * itemHeight,
    // 底部撑开的必须按「剩下多少行」算，而不是总高减去已渲染的高度：
    // 后者在 start 被夹到 0 时会多算一截，滚动条比实际内容长一块
    paddingBottom: math.max(0.0, (count - 1 - end) * itemHeight),
    totalHeight: totalHeight,
  );
}

/// 把某一行滚到视野里。
///
/// 已经完整可见就不动——「定位到某行」时如果每次都把它滚到顶部，
/// 用户会觉得列表在自己乱跳，而他明明已经看得见那一行了。
double scrollToRow(int index, double itemHeight, double scrollTop, double viewportHeight) {
  final top = index * itemHeight;
  final bottom = top + itemHeight;
  if (top < scrollTop) return top;
  if (bottom > scrollTop + viewportHeight) return bottom - viewportHeight;
  return scrollTop;
}

/// 内容是否足够多到值得虚拟化。太少时虚拟化只是徒增复杂度与一次布局计算
bool shouldVirtualize(int count, {int threshold = 60}) => count > threshold;
