/// 文本有没有真的被截断（对应 packages/common/src/logic/overflow.ts）。
///
/// 比哪个方向、容差留多少，这两处各端最容易各写各的。写错了不会报错，
/// 只会让提示一直不出现，或者每一行短文案都挂着一个多余的浮层。
library;

class OverflowMetrics {
  final double scrollWidth;
  final double clientWidth;
  final double scrollHeight;
  final double clientHeight;

  const OverflowMetrics({
    required this.scrollWidth,
    required this.clientWidth,
    required this.scrollHeight,
    required this.clientHeight,
  });
}

/// 亚像素容差。布局宽高是小数，两个值各自取整的方向不一定相同，
/// 于是没截断的文字也能差出零点几像素。不留容差的话，一整列短文案会全都挂上提示。
const double kOverflowEpsilon = 1;

/// 单行看宽度，多行看高度。
///
/// 这是最容易写歪的一处：多行截断永远不会横向溢出，拿宽度去判断的话
/// 条件永远不成立，提示一次都不会出现——而且不报错，只是「这个功能好像没做」。
bool isTextOverflowing(OverflowMetrics metrics, [bool multiline = false]) {
  if (multiline) {
    return metrics.scrollHeight - metrics.clientHeight > kOverflowEpsilon;
  }
  return metrics.scrollWidth - metrics.clientWidth > kOverflowEpsilon;
}
