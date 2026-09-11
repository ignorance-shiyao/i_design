/// 自绘滚动条的几何计算（对应 packages/common/src/logic/scroll.ts 的滑块部分）。
///
/// 滑块多长、停在哪、拖到某处对应内容滚多远，这三件事必须两端一致：
/// 差一点点，滚到底时滑块就会露在轨道外，或者永远差一截到不了底。
library;

import 'dart:math' as math;

/// 滚动状态。用记录类型而不是新建一个类：调用处多是临时测量出来的三个数，
/// 为它们造一个类只会让每个调用点多写一行。
typedef ScrollBarMetrics = ({
  double scrollTop,
  double clientHeight,
  double scrollHeight,
});

class ScrollThumb {
  /// 滑块长度（像素）
  final double size;

  /// 滑块距轨道起点的偏移（像素）
  final double offset;

  /// 内容装得下时不需要滚动条
  final bool visible;

  const ScrollThumb({required this.size, required this.offset, required this.visible});
}

/// 滑块的最小长度。再短就抓不住了，而内容越长滑块越短，不设下限会缩成一个点
const double kScrollThumbMin = 24;

/// 由滚动状态算出滑块的长度与位置。
///
/// 长度按「可视区占内容」的比例，位置按「已滚动占可滚动」的比例——
/// 注意这两个分母不同：位置的分母要扣掉滑块自身长度，
/// 用同一个分母的话，滚到底时滑块会露出轨道外一截。
ScrollThumb scrollThumb(
  ScrollBarMetrics metrics,
  double trackLength, [
  double minSize = kScrollThumbMin,
]) {
  if (metrics.scrollHeight <= metrics.clientHeight || trackLength <= 0) {
    return const ScrollThumb(size: 0, offset: 0, visible: false);
  }

  final ratio = metrics.clientHeight / metrics.scrollHeight;
  final size = math.max(minSize, (trackLength * ratio).roundToDouble());
  final maxScroll = metrics.scrollHeight - metrics.clientHeight;
  final progress = maxScroll <= 0 ? 0.0 : math.min(1.0, math.max(0.0, metrics.scrollTop / maxScroll));
  return ScrollThumb(
    size: size,
    offset: ((trackLength - size) * progress).roundToDouble(),
    visible: true,
  );
}

/// 拖动滑块时，滑块偏移反推内容该滚到哪。
/// 与 scrollThumb 互为逆运算，因此分母同样要扣掉滑块长度。
double scrollTopOfThumb(
  double offset,
  double thumbSize,
  double trackLength,
  ScrollBarMetrics metrics,
) {
  final room = trackLength - thumbSize;
  if (room <= 0) return 0;
  final progress = math.min(1.0, math.max(0.0, offset / room));
  return ((metrics.scrollHeight - metrics.clientHeight) * progress).roundToDouble();
}
