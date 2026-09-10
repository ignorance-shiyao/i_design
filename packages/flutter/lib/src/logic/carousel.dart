/// 走马灯翻页规则的 Dart 移植（对应 packages/common/src/logic/carousel.ts）。
///
/// 「轻轻一划算不算翻页」必须与 Web 端逐值一致：
/// 同一份数据在两端上答案不同，用户不会觉得是两个实现，只会觉得坏了。
library;

import 'dart:math' as math;

/// 触发翻页所需的位移，占容器宽度的比例
const double kSwipeRatio = 0.25;

/// 快速轻扫的速度阈值，单位是「像素 / 毫秒」
const double kSwipeVelocity = 0.35;

/// 一次滑动该不该翻页，翻哪个方向。返回 -1 / 0 / 1
///
/// 位移与速度任一达标即可，而不是只看位移：
/// 只看位移时，快速的短促轻扫会被判成「没划够」——那恰恰是手机上最自然的手势，
/// 用户会反复用力划几次，然后认为这个轮播很迟钝。
/// 只看速度也不行：缓慢但确实拖过半屏的动作同样是明确的翻页意图。
int resolveSwipe(
  double dx,
  double width,
  double durationMs, {
  double ratio = kSwipeRatio,
  double velocity = kSwipeVelocity,
}) {
  if (width == 0 || dx == 0) return 0;
  final far = dx.abs() >= width * ratio;
  final fast = durationMs > 0 && dx.abs() / durationMs >= velocity;
  if (!far && !fast) return 0;
  // 手指往左划是「看下一张」，所以方向与位移符号相反
  return dx < 0 ? 1 : -1;
}

/// 翻页后的下标。
///
/// loop 时首尾相接；不 loop 时停在两端而不是回绕——
/// 不循环的轮播突然从最后一张跳回第一张，读者会以为自己划错了方向。
int nextIndex(int current, int count, int delta, {bool loop = true}) {
  if (count <= 0) return 0;
  final raw = current + delta;
  if (loop) return ((raw % count) + count) % count;
  return math.min(count - 1, math.max(0, raw));
}

/// 当前应当显示的位移，单位是「张」。
///
/// 拖动过程中把手指位移折算成小数张，这样每一帧都跟手；
/// 松手后由 nextIndex 决定落到哪一张，再做回弹动画。
double trackOffset(int index, double dragDx, double width) {
  if (width == 0) return index.toDouble();
  return index - dragDx / width;
}

/// 不循环时，拖到两端要有阻尼。
///
/// 到头了还能等距拖出去，看起来像「后面还有一张只是没加载」；
/// 打三折的阻尼既让人看出「到头了」，又不至于像卡住不动。
double rubberBand(double offset, int count, {bool loop = true}) {
  if (loop || count <= 0) return offset;
  final max = (count - 1).toDouble();
  if (offset < 0) return offset * 0.3;
  if (offset > max) return max + (offset - max) * 0.3;
  return offset;
}

class DotRange {
  const DotRange({required this.items, required this.active});

  /// 要渲染的点的下标
  final List<int> items;

  /// 这些点里哪一个是当前页
  final int active;
}

/// 指示点。超过上限就只显示当前页附近的一段。
///
/// 二十张图配二十个点，点会小到看不清，也数不出自己在第几张；
/// 显示一个滑动窗口，读者至少能看出「还在中间」还是「快到头了」。
DotRange dotRange(int index, int count, {int max = 7}) {
  if (count <= max) {
    return DotRange(items: List.generate(count, (i) => i), active: index);
  }
  final half = max ~/ 2;
  // 窗口贴住两端，不让它越过边界后留出空位
  final start = math.min(math.max(0, index - half), count - max);
  return DotRange(items: List.generate(max, (i) => start + i), active: index);
}

/// 自动播放此刻该不该走。
///
/// 悬停、聚焦、页面在后台、只有一张、用户要求减少动效——任一成立就停。
/// 后台里继续翻页是纯粹的耗电，而且用户切回来时看到的是随机一张；
/// 聚焦时不停则会把正在用键盘阅读的人从当前这张上甩走。
bool shouldAutoplay({
  required bool enabled,
  required int count,
  bool hovered = false,
  bool focused = false,
  bool dragging = false,
  bool documentHidden = false,
  bool reducedMotion = false,
}) =>
    enabled &&
    count > 1 &&
    !hovered &&
    !focused &&
    !dragging &&
    !documentHidden &&
    !reducedMotion;
