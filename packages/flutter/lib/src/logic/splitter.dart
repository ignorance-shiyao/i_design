/// 分割面板尺寸计算的 Dart 移植（对应 packages/common/src/logic/splitter.ts）。
///
/// 「拖到底会怎样」各端极容易给出不同答案：一端能把左栏拖没，
/// 另一端在 200px 处停住。两种都说得通，所以必须只写一份。
library;

import 'dart:math' as math;

/// 拖动后第一栏的新尺寸。
///
/// 两栏的下限一起夹：只夹第一栏的话，把它拖到很大时第二栏会被挤到零宽，
/// 里面的内容全部换行成一列单字——那时用户已经看不出该往回拖多少了。
double resizePane(
  double total,
  double next, {
  double firstMin = 0,
  double? firstMax,
  double secondMin = 0,
  double gutter = 4,
}) {
  final usable = math.max(0.0, total - gutter);
  final lowest = math.max(firstMin, 0.0);
  // 第二栏的下限反过来就是第一栏的上限
  final highest = math.min(firstMax ?? usable, usable - secondMin);
  if (highest < lowest) return lowest;
  return math.min(highest, math.max(lowest, next));
}

/// 像素尺寸换成百分比，用于响应式布局下保持比例
double paneRatio(double size, double total, {double gutter = 4}) {
  final usable = math.max(1.0, total - gutter);
  return math.min(1.0, math.max(0.0, size / usable));
}

double paneSize(double ratio, double total, {double gutter = 4}) =>
    math.max(0.0, (total - gutter) * math.min(1.0, math.max(0.0, ratio)));

/// 键盘调整的步长。
///
/// 分隔条必须能用键盘拖——它是个真正的控件，不是装饰。
/// 按住 Shift 走大步：一格一格挪到屏幕另一头要按上百次。
double keyboardStep(String key, bool shift) {
  final step = shift ? 48.0 : 8.0;
  if (key == 'ArrowLeft' || key == 'ArrowUp') return -step;
  if (key == 'ArrowRight' || key == 'ArrowDown') return step;
  return 0;
}
