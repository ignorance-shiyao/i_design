/// 下拉刷新的取值规则（与 packages/common/src/logic/pull.ts 同名同算法）。
///
/// 阻尼、阈值、松手后停在哪——三件事每个端都要做，而且必须做得一样：
/// 各端各写一遍的结果是同一个手势在一端刷得动、在另一端刷不动。
library;

import 'dart:math' as math;

enum PullState { idle, pulling, ready, refreshing }

/// 触发刷新的阈值：小于它松手就弹回去
const double kPullThreshold = 56;

/// 刷新中停留的高度，给指示器留出位置
const double kPullLoadingHeight = 48;

/// 最多能拉多远。再往下拉不动，避免整页被拖走
const double kPullMax = 120;

/// 阻尼：拉得越远越拉不动。
///
/// 用渐近曲线而不是平方根：平方根在起手那一小段会把位移放大——
/// 手指才动 10 内容已经走了 17，松手前就觉得页面在自己跑。
/// 这条曲线起手处斜率正好是 1（跟手），越往下越重，趋近 kPullMax 停住。
double pullDistance(double rawDistance) {
  if (rawDistance <= 0) return 0;
  final damped = kPullMax * (1 - 1 / (rawDistance / kPullMax + 1));
  return math.min(damped.roundToDouble(), kPullMax);
}

/// 当前应当显示哪种状态。refreshing 由调用方持有，因此单独传入
PullState pullState(double distance, bool refreshing) {
  if (refreshing) return PullState.refreshing;
  if (distance <= 0) return PullState.idle;
  return distance >= kPullThreshold ? PullState.ready : PullState.pulling;
}

/// 松手后停在哪：够了就停在刷新高度，不够就弹回 0
double pullRelease(double distance) => distance >= kPullThreshold ? kPullLoadingHeight : 0;

/// 指示器的旋转角度：跟着下拉进度转满半圈，到阈值正好 180°
int pullRotate(double distance) {
  final ratio = distance / kPullThreshold;
  final clamped = ratio < 1 ? ratio : 1.0;
  return (clamped * 180).round();
}
