/// 下拉刷新的位移与状态。
///
/// 与 packages/common/src/logic/pullrefresh.ts 一一对应；
/// 阈值与阻尼曲线写死在公共层，各端才是同一种手感。
enum IPullStatus { idle, pulling, ready, refreshing, done }

/// 拉到这里松手才刷新。60px 大约是一个拇指的自然行程
const double kPullThreshold = 60;

/// 最多能拉这么远。不封顶的话，用力一甩能把列表拽到屏幕外
const double kPullMax = 120;

/// 手指位移换成实际下拉距离，带阻尼。
///
/// 一比一跟手是错的：越拉越沉才符合物理直觉，也才让人知道「快到头了」。
/// max·d/(max+d) 这条渐近曲线开头几乎跟手（拉 10px 走 9.2px），
/// 越往后越沉（拉 200px 只走 75px），并且永远逼近 max 而到不了——
/// 因此不需要额外封顶：硬截会在到顶那一刻突然停住，手指还在动而画面不动。
double pullDistance(double delta, {double max = kPullMax}) {
  if (delta <= 0) return 0;
  return (max * delta) / (max + delta);
}

/// 拉动过程中的状态：过了阈值就该改文案，让用户知道松手会发生什么
IPullStatus pullStatus(double distance, {double threshold = kPullThreshold}) {
  if (distance <= 0) return IPullStatus.idle;
  return distance >= threshold ? IPullStatus.ready : IPullStatus.pulling;
}

/// 松手后是否要触发刷新
bool shouldRefresh(double distance, {double threshold = kPullThreshold}) =>
    distance >= threshold;

/// 每个状态下显示什么文案。
///
/// 文案与状态绑死在一处，各端不会一个写「下拉刷新」一个写「下拉可以刷新」。
String pullHint(IPullStatus status) {
  switch (status) {
    case IPullStatus.pulling:
      return '下拉可以刷新';
    case IPullStatus.ready:
      return '松开立即刷新';
    case IPullStatus.refreshing:
      return '正在刷新…';
    case IPullStatus.done:
      return '刷新完成';
    case IPullStatus.idle:
      return '';
  }
}

/// 刷新中头部停留的高度。
///
/// 停在阈值处而不是收回零：收回零的话加载指示器立刻消失，
/// 用户不知道刷新还在进行，会再拉一次。
double refreshingOffset({double threshold = kPullThreshold}) => threshold;
