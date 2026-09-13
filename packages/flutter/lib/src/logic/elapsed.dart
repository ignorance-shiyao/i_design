/// 「已等多久」的显示规则（对应 packages/common/src/logic/elapsed.ts）。
///
/// 智能体的一次调用动辄十几秒。只转一个圈而不说等了多久，用户没有参照，
/// 三秒和三十秒看起来一模一样——于是有人开始反复点，或者以为卡死了退出重进，
/// 前一次请求的结果就此丢掉。
library;

/// 多久之后才显示计时。
///
/// 一秒内就返回的请求上挂一个「0 秒」只会让界面更吵。三秒是个折中：
/// 比它快的请求用户根本来不及产生「是不是卡了」的疑问。
const int kElapsedThreshold = 3000;

/// 到点了吗。没到就只转圈，不给数字
bool shouldShowElapsed(int ms, {int threshold = kElapsedThreshold}) => ms >= threshold;

class IElapsedParts {
  const IElapsedParts({required this.minutes, required this.seconds});

  final int minutes;
  final int seconds;
}

/// 拆成分与秒。
///
/// 向下取整而不是四舍五入：显示「5 秒」时实际至少已经等了 5 秒，
/// 取整到 6 秒会出现「数字比真实时间还大」，在计时这件事上比慢一点更糟。
IElapsedParts elapsedParts(int ms) {
  final total = ms < 0 ? 0 : ms ~/ 1000;
  return IElapsedParts(minutes: total ~/ 60, seconds: total % 60);
}

/// 下一次刷新该等多久（毫秒）。对齐到下一个整秒，避免累积漂移。
int elapsedInterval(int ms) {
  final rest = ms % 1000;
  return rest == 0 ? 1000 : 1000 - rest;
}
