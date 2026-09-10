/// 吸附与回到顶部判定的 Dart 移植（对应 packages/common/src/logic/affix.ts）。
///
/// 「什么时候该吸住」「什么时候该露出回到顶部」算错的表现都很轻微——
/// 吸早了半屏、按钮闪一下就没——没人会当成缺陷报上来，但用起来就是不对。
library;

import 'dart:math' as math;

enum IAffixMode { none, top, bottom }

class IAffixState {
  const IAffixState({required this.mode, required this.offset});
  final IAffixMode mode;

  /// 吸住时距离视口顶/底的偏移
  final double offset;

  @override
  bool operator ==(Object other) =>
      other is IAffixState && other.mode == mode && other.offset == offset;

  @override
  int get hashCode => Object.hash(mode, offset);

  @override
  String toString() => 'IAffixState($mode, $offset)';
}

/// 该不该吸住，吸在哪一边。
///
/// 容器底部先于元素滚出视口时，元素要跟着一起走，而不是继续钉在顶上——
/// 一个已经和内容无关的浮块钉在屏幕顶端，读者会以为它属于下一节。
IAffixState resolveAffix({
  required double offsetTop,
  required double height,
  required double scrollTop,
  required double viewportHeight,
  double? containerBottom,
  double? top,
  double? bottom,
}) {
  if (bottom != null) {
    final elementBottom = offsetTop + height;
    final viewportBottom = scrollTop + viewportHeight;
    return elementBottom > viewportBottom - bottom
        ? IAffixState(mode: IAffixMode.bottom, offset: bottom)
        : const IAffixState(mode: IAffixMode.none, offset: 0);
  }

  final threshold = top ?? 0;
  if (scrollTop + threshold <= offsetTop) {
    return const IAffixState(mode: IAffixMode.none, offset: 0);
  }

  // 容器要走了就跟着走：把元素往上顶，而不是让它继续钉着
  if (containerBottom != null) {
    final stickyBottom = scrollTop + threshold + height;
    if (stickyBottom > containerBottom) {
      return IAffixState(
        mode: IAffixMode.top,
        offset: threshold - (stickyBottom - containerBottom),
      );
    }
  }
  return IAffixState(mode: IAffixMode.top, offset: threshold);
}

/// 回到顶部按钮该不该露出来。
///
/// 阈值默认一屏：滚动不足一屏时，用户自己往回划两下就到顶了，
/// 这时冒出一个按钮属于帮倒忙——它遮住的内容比它省下的力气多。
bool shouldShowBackTop(double scrollTop, double viewportHeight, {double? threshold}) =>
    scrollTop > (threshold ?? viewportHeight);

/// 平滑滚回顶部时，每一帧该在哪。
///
/// 缓动用三次方 ease-out——匀速滚动看起来像被拖拽，减速才像「到站」。
double backTopFrame(double from, double elapsed, {double duration = 320}) {
  if (elapsed >= duration) return 0;
  final t = elapsed / duration;
  final eased = 1 - math.pow(1 - t, 3);
  return from * (1 - eased);
}
